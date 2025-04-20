const {
  sendNotification,
  getNotifications,
} = require("../services/notificationService");


exports.sendNewNotification = async (req, res) => {
  const { to, title, body, type, showToast } = req.body;

  const { success, error } = await sendNotification({
    to,
    title,
    body,
    type,
    showToast,
  });

  if (error) {
    return res
      .status(500)
      .json({ message: "Error sending notification", error });
  }

  return res.status(200).json({ message: "Notification sent successfully" });
};


exports.fetchNotifications = async (req, res) => {
  const userId = req.user._id; 

  const { data, error } = await getNotifications(userId);

  if (error) {
    return res
      .status(500)
      .json({ message: "Error fetching notifications", error });
  }

  return res.status(200).json({ notifications: data });
};
