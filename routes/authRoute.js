const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");
const ensureRoleNotAssigned = require("../middlewares/checkRole");
const getAuthenticatedUser = require("../middlewares/userAuth");

const { login, signup } = require("../controllers/emailPasswordAuthController");

const { checkUserStatus } = require("../controllers/checkUserController");

router.get("/api/checkUser",getAuthenticatedUser, checkUserStatus);

router.get("/role", ensureRoleNotAssigned, (req, res) => {
  res.render("roleSelection");
});

router.get("/auth/google/creator", googleAuthController.googleAuthCreator);

router.get("/auth/google/editor", googleAuthController.googleAuthEditor);

router.get("/auth/google/callback", googleAuthController.googleCallback);

router.post("/logout", googleAuthController.logout);

router.post("/signup", signup);

router.post("/login", login);

module.exports = router;
