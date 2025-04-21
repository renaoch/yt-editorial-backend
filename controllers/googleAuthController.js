const passport = require("passport");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const googleAuthController = {
  googleAuthCreator: (req, res, next) => {
    req.session.intendedRole = "creator";
    console.log("googleAuthCreator called");
    console.log("Session before auth redirect:", req.session);

    passport.authenticate("google", {
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/youtube.upload",
      ],
      accessType: "offline",
      prompt: "consent",
    })(req, res, next);
  },

  googleAuthEditor: (req, res, next) => {
    req.session.intendedRole = "editor";
    console.log("googleAuthEditor called");
    console.log("Session before auth redirect:", req.session);

    passport.authenticate("google", {
      scope: ["profile", "email"],
      accessType: "offline",
      prompt: "consent",
    })(req, res, next);
  },

  googleCallback: async (req, res, next) => {
    console.log("googleCallback invoked");
    console.log("Session at callback entry:", req.session);

    passport.authenticate("google", async (err, user, info) => {
      if (err || !user) {
        console.error("Google OAuth failed");
        if (err) console.error("Error object:", err);
        if (!user) console.error("No user returned from Google strategy");
        return res.redirect("/auth/google");
      }

      console.log("Google OAuth successful");
      console.log("User returned from Google:", user);
      console.log("Info returned from Google:", info);
      req.user = user;
      req.logIn(user, async (err) => {
        if (err) {
          console.error("Login error occurred");
          console.error("Login error:", err);
          return res.redirect("/auth/google");
        }
        console.log("Session ID (connect.sid):", req.sessionID);
        console.log("User logged in successfully");
        console.log("User after login:", req.user);
        console.log("Session after login:", req.session);

        if (info?.accessToken) {
          req.session.accessToken = info.accessToken;
          console.log("Access token saved to session:", info.accessToken);
        }

        if (req.session.upgradingScope) {
          console.log("Scope upgrade detected, redirecting...");
          delete req.session.upgradingScope;
          return res.redirect(`${process.env.BASE_URL}/app?scopeUpgraded=true`);
        }

        try {
          console.log("Fetching user from Supabase with ID:", user._id);
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("_id", user._id)
            .single();

          if (error) {
            console.error("Error while querying Supabase:", error);
          } else {
            console.log("User found in Supabase:", data);
          }

          return res.redirect(`${process.env.FE_BASE_URL}/app`);
        } catch (error) {
          console.error("Exception while checking user role in Supabase");
          console.error("Exception error:", error);
          return res.redirect("/auth/google");
        }
      });
    })(req, res, next);
  },

  logout: (req, res) => {
    console.log("Logout called");

    req.logout((err) => {
      if (err) {
        console.error("Logout function error:", err);
      } else {
        console.log("User successfully logged out");
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        } else {
          console.log("Session destroyed successfully");
        }

        res.redirect(`${process.env.FE_BASE_URL}`);
      });
    });
  },
};

module.exports = googleAuthController;
