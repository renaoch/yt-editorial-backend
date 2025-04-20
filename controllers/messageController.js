

const { supabase } = require("../config/supabaseClient"); 


exports.sendMessage = async (req, res) => {
  const { receiverId, messageText } = req.body;
  const senderId = req.user._id; 

  
  if (!receiverId || !messageText) {
    return res
      .status(400)
      .json({ error: "Receiver ID and message text are required" });
  }

  
  console.log("Received message data:", {
    senderId: senderId, 
    receiverId: receiverId,
    messageText,
  });

  try {
    
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          message: messageText,
          status: "sent",
          created_at: new Date().toISOString(), 
        },
      ])
      .select() 
      .maybeSingle(); 

    console.log("Inserted message data:", data);
    console.log("Insert error:", insertError);

    
    if (insertError) {
      console.error("Error inserting message into database:", insertError);
      return res.status(500).json({
        error: "Failed to send message",
        details: insertError.message || insertError,
      });
    }

    
    if (!data) {
      return res.status(500).json({
        error: "Failed to insert message into database",
      });
    }
    
    
    
    
    
    
    
    
    return res.status(201).json({
      message: "Message sent successfully",
      data: {
        id: data.id, 
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        message: data.message,
        status: data.status,
        created_at: data.created_at || new Date().toISOString(), 
      },
    });
  } catch (err) {
    console.error("Error during message insertion:", err);
    return res
      .status(500)
      .json({ error: "Failed to insert message", details: err.message });
  }
};


exports.getMessages = async (req, res) => {
  const senderId = req.user._id; 
  const { receiverId } = req.params; 

  
  if (!receiverId) {
    return res.status(400).json({ error: "Receiver ID is required" });
  }

  
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch messages", details: error });
  }

  return res.status(200).json({ messages: data });
};
