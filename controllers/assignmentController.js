
const { createClient } = require("@supabase/supabase-js");
const { sendNotification } = require("../services/notificationService");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.sendAssignmentRequest = async (req, res) => {
  const { editor_id } = req.body;
  const creator_id = req.user._id;

  
  if (editor_id === creator_id) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }

  
  const { data: existing, error: checkError } = await supabase
    .from("assignment_requests")
    .select("*")
    .eq("creator_id", creator_id)
    .eq("editor_id", editor_id)
    .in("status", ["pending", "accepted"]) 
    .maybeSingle();

  if (checkError)
    return res.status(500).json({ success: false, message: "Check error" });

  if (existing) {
    return res
      .status(400)
      .json({ success: false, message: "Request already exists" });
  }

  
  const { error } = await supabase
    .from("assignment_requests")
    .insert([{ creator_id, editor_id, status: "pending" }]);

  if (error)
    return res.status(500).json({ success: false, message: "Insert failed" });
  await sendNotification({
    to: editor_id, 
    title: "Send you a request",
    body: `Someone has send you a request`,
    type: "assign-editor-req", 
    showToast: true, 
  });
  res.json({ success: true, message: "Assignment request sent" });
};

exports.getAssignmentRequest = async (req, res) => {
  const editor_id = req.user._id; 

  const { data, error } = await supabase
    .from("assignment_requests")
    .select(
      `
        id,
        status,
        creator_id,
        created_at,
        users!assignment_requests_creator_id_fkey (_id, name, email, avatar) -- Explicitly using the creator relationship and _id column
        users!assignment_requests_editor_id_fkey (_id, name, email, avatar) -- Explicitly using the editor relationship and _id column
      `
    )
    .eq("editor_id", editor_id)
    .eq("status", "pending"); 

  if (error) {
    console.error("Supabase error:", error); 
    return res
      .status(500)
      .json({ success: false, message: "Fetch failed", error: error.message });
  }

  res.json({ success: true, requests: data });
};
exports.acceptAssignmentRequest = async (req, res) => {
  const { requestId } = req.params;
  const editor_id = req.user._id;

  
  const { data: request, error: fetchError } = await supabase
    .from("assignment_requests")
    .select("id, creator_id, editor_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return res
      .status(404)
      .json({ success: false, message: "Request not found" });
  }

  
  if (request.editor_id !== editor_id) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized to accept this request" });
  }

  
  if (request.status === "accepted") {
    return res
      .status(400)
      .json({ success: false, message: "Request already accepted" });
  }

  
  const { error: updateError } = await supabase
    .from("assignment_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateError) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to accept the request" });
  }

  
  const { error: insertError } = await supabase
    .from("creators_editors_assignment") 
    .insert([
      {
        creator_id: request.creator_id,
        editor_id: request.editor_id,
        status: "in-progress",
      },
    ]);

  if (insertError) {
    return res.status(500).json({
      success: false,
      message: "Failed to create assignment relation",
    });
  }

  return res.json({
    success: true,
    message: "Request accepted and assignment created!",
  });
};
