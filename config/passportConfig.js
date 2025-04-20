const { createClient } = require("@supabase/supabase-js");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL + process.env.GOOGLE_CALLBACK_PATH,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        const { data: existingUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", profile.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          return done(error, null);
        }

        let user = existingUser;

        if (!user) {
          const role = request.session?.intendedRole || null;
          console.log("role", role);
          const { data, error: insertError } = await supabase
            .from("users")
            .insert([
              {
                google_id: profile.id,
                username: profile.given_name,
                email: profile.email,
                avatar: profile.picture,
                name:
                  profile.displayName ||
                  `${profile.given_name} ${profile.family_name}` ||
                  profile.given_name ||
                  "Unnamed",
                is_online: true,
                role, // 👈 assign role during creation
              },
            ])
            .select()
            .maybeSingle();

          if (insertError) {
            console.error("Insert Error:", insertError);
            return done(insertError, null);
          }

          user = data;
        } else {
          // You can optionally update the role here too, if needed
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ is_online: true })
            .eq("google_id", profile.id)
            .select()
            .maybeSingle();

          if (updateError) {
            console.error("Update Error:", updateError);
            return done(updateError, null);
          }

          user = updatedUser;
        }

        user.accessToken = accessToken;

        return done(null, user, { accessToken });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  const userId = user.id || user._id;
console.log("userID inside passport serializeUser",userId);
  if (!userId) {
    console.error(" Cannot serialize user: ", user);
    return done(new Error("User ID not found in serializeUser"), null);
  }

  done(null, userId);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("_id", id)
      .single();
console.log("user inside passport serializeUser",user);


    if (error || !user) {
      console.error(" Failed to deserialize user:", error || "No user found");
      return done(error || new Error("User not found"), null);
    }

    if (!user._id) {
      console.error(" User _id is missing in the deserialization step");
      return done(new Error("User _id is missing"), null);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ is_online: true })
      .eq("_id", user._id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error(
        " Failed to mark user as online on deserialize:",
        updateError
      );
    }

    done(null, updatedUser);
  } catch (err) {
    console.error(" Exception during deserializeUser:", err);
    done(err, null);
  }
});
