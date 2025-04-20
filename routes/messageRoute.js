const express = require("express");
const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");
const router = express.Router();
const getAuthenticatedUser = require("../middlewares/userAuth");


router.post("/send", getAuthenticatedUser, sendMessage);


router.get("/:receiverId", getAuthenticatedUser, getMessages);

module.exports = router;
