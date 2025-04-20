const express = require("express");
const notificationController = require("../controllers/notificationController");
const notificationService = require("../services/notificationService");
const getAuthenticatedUser = require("../middlewares/userAuth");

const router = express.Router();


router.post(
  "/notifications/send",
  getAuthenticatedUser,
  notificationController.sendNewNotification
);


router.get(
  "/notifications",
  getAuthenticatedUser,
  notificationController.fetchNotifications
);


router.patch(
  "/notifications/:id/read", 
  getAuthenticatedUser,
  notificationService.markNotificationAsRead
);
module.exports = router;
