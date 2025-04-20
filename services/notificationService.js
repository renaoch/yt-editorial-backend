const { supabase } = require("../config/supabaseClient"); 
const { toast } = require("sonner"); 

exports.sendNotification = async ({
  to,
  title,
  body,
  type = "general",
  showToast = false,
}) => {
  const { error } = await supabase
    .from("notifications")
    .insert([{ user_id: to, title, body, type }]);

  if (error) {
    console.error("Error sending notification:", error.message);
    return { error: error.message };
  }

  
  if (showToast) {
    toast(title, { description: body });
  }

  return { success: true };
};
exports.getNotifications = async (userId) => {
  try {
    
    const intUserId = parseInt(userId, 10);

    if (isNaN(intUserId)) {
      console.error("Invalid user ID:", userId);
      return { error: "Invalid user ID" };
    }

    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", intUserId) 
      .order("created_at", { ascending: false });

    if (error) {
      
      console.error(
        `Error fetching notifications for user ${intUserId}:`,
        error.message
      );
      return { error: "There was an error fetching notifications." }; 
    }

    return { data }; 
  } catch (err) {
    
    console.error(
      `Unexpected error fetching notifications for user ${userId}:`,
      err
    );
    return {
      error: "An unexpected error occurred while fetching notifications.",
    };
  }
};

exports.markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.id; 
  const userId = req.user._id; 

  try {
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true }) 
      .eq("id", notificationId) 
      .eq("user_id", userId); 

    if (error) {
      console.error("Error marking notification as read:", error.message);
      return res
        .status(400)
        .json({ error: "Error marking notification as read." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Notification marked as read." });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};
