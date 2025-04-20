const { supabase } = require("../config/supabaseClient"); 
const ROLES = require("../constants/roles");

exports.assignEditor = async (req, res) => {
  try {
    const { editor_id } = req.body;
    const creator_id = req.user._id; 
    console.log("Creator ID:", creator_id);
    console.log("Editor ID:", editor_id);

    if (req.user.role !== ROLES.CREATOR) {
      return res
        .status(403)
        .json({ success: false, message: "Only creators allowed" });
    }

    
    const { data: relation, error } = await supabase
      .from("creators_editors_assignment") 
      .insert([{ creator_id, editor_id }]);

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    res.json({ success: true, message: "Editor assigned", relation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getEditors = async (req, res) => {
  console.log("under fuck");
  console.log(req.user);
  try {
    if (req.user.role !== ROLES.CREATOR) {
      return res
        .status(403)
        .json({ success: false, message: "Only creators allowed" });
    }

    const creator_id = req.user._id;
    console.log("Creator ID:", creator_id);

    
    const { data: editors, error: editorsError } = await supabase
      .from("users") 
      .select("_id, name, email, avatar, description")
      .eq("role", "editor");

    if (editorsError) {
      console.error(editorsError);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    
    const { data: assignedRelations, error: assignmentError } = await supabase
      .from("creators_editors_assignment") 
      .select("editor_id")
      .eq("creator_id", creator_id);

    if (assignmentError) {
      console.error(assignmentError);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    
    const assignedEditorIds = assignedRelations.map((rel) =>
      rel.editor_id.toString()
    );

    
    const enrichedEditors = editors.map((editor) => ({
      ...editor,
      assigned: assignedEditorIds.includes(editor._id.toString()), 
    }));

    res.json({ success: true, editors: enrichedEditors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAssignedEditors = async (req, res) => {
  try {
    if (req.user.role !== ROLES.CREATOR) {
      return res
        .status(403)
        .json({ success: false, message: "Only creators allowed" });
    }

    const creator_id = req.user._id;

    
    const { data: assignedRelations, error } = await supabase
      .from("creators_editors_assignment") 
      .select("editor_id")
      .eq("creator_id", creator_id);

    if (error) {
      console.error("Get assigned editors error:", error.message);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const assignedEditorIds = assignedRelations.map((rel) => rel.editor_id);

    
    const { data: assignedEditors, error: editorsError } = await supabase
      .from("users") 
      .select("_id, name, email, avatar")
      .in("_id", assignedEditorIds);

    if (editorsError) {
      console.error(editorsError);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    res.json({ success: true, editors: assignedEditors });
  } catch (err) {
    console.error("Get assigned editors error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
