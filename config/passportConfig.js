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
      console.log("GoogleStrategy callback hit");
      console.log("Google profile:", profile);

      try {
        console.log("Checking if user exists in Supabase with google_id:", profile.id);

        const { data: existingUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", profile.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Supabase select error:", error);
          return done(error, null);
        }

        let user = existingUser;

        if (!user) {
          const role = request.session?.intendedRole || null;
          console.log("No user found, creating new user with role:", role);

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
                role,
              },
            ])
            .select()
            .maybeSingle();

          if (insertError) {
            console.error("Error inserting new user:", insertError);
            return done(insertError, null);
          }

          console.log("New user created:", data);
          user = data;
        } else {
          console.log("User already exists. Marking user as online");

          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ is_online: true })
            .eq("google_id", profile.id)
            .select()
            .maybeSingle();

          if (updateError) {
            console.error("Error updating user is_online:", updateError);
            return done(updateError, null);
          }

          console.log("User updated:", updatedUser);
          user = updatedUser;
        }

        user.accessToken = accessToken;
        console.log("AccessToken attached to user");
        return done(null, user, { accessToken });
      } catch (err) {
        console.error("Unexpected error in GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  const userId = user.id || user._id;
  console.log("Serializing user. userID:", userId);

  if (!userId) {
    console.error("Cannot serialize user. No ID found:", user);
    return done(new Error("User ID not found in serializeUser"), null);
  }

  done(null, userId);
});

passport.deserializeUser(async (id, done) => {
  console.log("Deserializing user. ID:", id);

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("_id", id)
      .single();

    if (error || !user) {
      console.error("Error fetching user from Supabase:", error || "No user found");
      return done(error || new Error("User not found"), null);
    }

    if (!user._id) {
      console.error("Deserialized user missing _id:", user);
      return done(new Error("User _id is missing"), null);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ is_online: true })
      .eq("_id", user._id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Error setting user is_online in deserialize:", updateError);
    } else {
      console.log("User marked as online in deserialize:", updatedUser);
    }
console.log(data);
    done(null, updatedUser);
  } catch (err) {
    console.error("Exception during deserializeUser:", err);
    done(err, null);
  }
});
