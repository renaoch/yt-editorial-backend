const ROLES = require("../constants/roles");

const { createClient } = require("@supabase/supabase-js");


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.getAssignedCreators = async (req, res) => {
  try {
    
    if (req.user.role !== ROLES.EDITOR) {
      return res.status(403).json({
        success: false,
        message: "Only editors allowed",
      });
    }

    const editor_id = req.user._id;

    
    const { data: assignedRelations, error } = await supabase
      .from("creators_editors_assignment") 
      .select("creator_id") 
      .eq("editor_id", editor_id) 
      .eq("status", "in-progress"); 

    if (error) {
      console.error("Error fetching assigned creators:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching assigned creators",
      });
    }

    
    if (!assignedRelations || assignedRelations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No creators assigned to this editor.",
      });
    }

    
    const creatorIds = assignedRelations.map((relation) => relation.creator_id);

    
    const { data: assignedCreators, error: fetchCreatorsError } = await supabase
      .from("users") 
      .select("_id, name, email, avatar") 
      .in("_id", creatorIds); 

    if (fetchCreatorsError) {
      console.error("Error fetching creators:", fetchCreatorsError.message);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching creator details",
      });
    }

    
    if (!assignedCreators || assignedCreators.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No creator details found for the assigned creators.",
      });
    }

    
    res.json({
      success: true,
      creators: assignedCreators, 
    });
  } catch (err) {
    console.error("Error in getAssignedCreators:", err.message);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing the request.",
    });
  }
};
