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
    req.session.intendedRole = "creator"; //  Set creator role
    console.log(req.session)
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
    passport.authenticate("google", {
      scope: ["profile", "email"],
      accessType: "offline",
      prompt: "consent",
    })(req, res, next);
  },

  googleCallback: async (req, res, next) => {
    passport.authenticate("google", async (err, user, info) => {
      if (err || !user) {
        console.error("Google OAuth failed:", err || "No user returned");
        return res.redirect("/auth/google");
      }

      req.logIn(user, async (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/auth/google");
        }
console.log("login Hit")
       
        if (info?.accessToken) {
          req.session.accessToken = info.accessToken;
        }

      
        if (req.session.upgradingScope) {
          delete req.session.upgradingScope;
          return res.redirect(`${process.env.BASE_URL}/app?scopeUpgraded=true`);
        }

        try {
          // Fetch the user from Supabase
          const { data, error } = await supabase
            .from("users") // Assuming you have a `users` table
            .select("*")
            .eq("_id", user._id)
            .single();

          return res.redirect(`${process.env.FE_BASE_URL}/app`);
        } catch (error) {
          console.error("Error checking user role:", error);
          return res.redirect("/auth/google");
        }
      });
    })(req, res, next);
  },

  // Logout functionality
  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        // Redirect user to home page or login page
        res.redirect(`${process.env.BASE_URL}/login`);
      });
    });
  },
};

module.exports = googleAuthController;
