const { createClient } = require("@supabase/supabase-js");
const { sendNotification } = require("../services/notificationService");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.createTask = async (req, res) => {
  const {
    title,
    description,
    editorId,
    status = "pending",
    deadline,
  } = req.body;
  const creatorId = req.user._id;

  if (!title || !status) {
    return res.status(400).json({ message: "Title and status are required" });
  }

  try {
    const { data: task, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description,
          creator_id: creatorId,
          editor_id: editorId || null,
          status,
          deadline,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(500).json({ message: "Failed to create task", error });
    }
    await sendNotification({
      to: editorId, 
      title: "New Task!",
      body: `New task assigned ${title}`,
      type: "task-create", 
      showToast: true, 
    });

    return res.status(201).json({ message: "Task created", task });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
exports.getTasks = async (req, res) => {
  try {
    const user = req.user;

    let query = supabase.from("tasks").select(
      `*,
             editor:users!tasks_editor_id_fkey(_id, name, email),
             creator:users!tasks_creator_id_fkey(_id, name, email)`
    );

    
    if (user.role === "editor") {
      query = query.eq("editor_id", user._id);
    } else if (user.role === "creator") {
      query = query.eq("creator_id", user._id);
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase fetch error:", error);
      return res.status(500).json({ message: "Failed to fetch tasks", error });
    }

    
    const tasksWithVideos = await Promise.all(
      data.map(async (task) => {
        
        const { data: videoVersions, error: videoError } = await supabase
          .from("video_versions")
          .select("video_url, version_number")
          .eq("task_id", task._id) 
          .order("version_number", { ascending: false }) 
          .limit(1); 

        if (videoError) {
          console.error("❌ Video fetch error:", videoError);
          task.video = { message: "Error fetching video" }; 
        } else if (videoVersions.length > 0) {
          task.video = videoVersions[0]; 
        } else {
          task.video = { message: "No video uploaded" }; 
        }

        return task; 
      })
    );

    
    return res.status(200).json(tasksWithVideos);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
