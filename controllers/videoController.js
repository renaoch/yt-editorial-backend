const { uploadToR2 } = require("../services/cloudflareR2/videoUploadR2Service");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const { sendNotification } = require("../services/notificationService");

exports.uploadVideo = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;
    const role = req.user.role;
    const taskId = req.body.task_id;
    const tags = req.body.tags || null;
    const notes = req.body.notes || null;
    const creatorId = req.body.creatorId;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    if (!taskId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing task_id" });
    }

    if (tags && typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Malformed tags format" });
      }
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const objectKey = `uploads/${filename}`;
    const videoUrl = await uploadToR2(file, objectKey);

    // Fetch the latest version number
    const { data: existingVersions, error: versionErr } = await supabase
      .from("video_versions")
      .select("version_number")
      .eq("task_id", taskId)
      .order("version_number", { ascending: false })
      .limit(1);

    if (versionErr) throw versionErr;

    const nextVersion = existingVersions?.[0]?.version_number + 1 || 1;

    // Insert the new video version
    const { data, error } = await supabase
      .from("video_versions")
      .insert([
        {
          task_id: taskId,
          uploaded_by: userId,
          video_url: videoUrl,
          version_number: nextVersion,
          tags,
          notes,
        },
      ])
      .select("*");
    console.log("creatorID:", creatorId);
    if (error) throw error;
    await sendNotification({
      to: creatorId,
      title: "Task Completed",
      body: `The task  has been completed:`,
      type: "task-create",
      showToast: true,
    });
    return res.json({
      success: true,
      message: "Video uploaded successfully",
      video: data[0],
    });
  } catch (err) {
    console.error(" Upload error:", err.message);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

exports.getMyVideos = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { editor_id } = req.query;

    let filter = {};

    if (role === "creator") {
      filter.creator_id = userId;
      if (editor_id) {
        filter.editor_id = editor_id;
      }
    } else if (role === "editor") {
      filter.editor_id = userId;
    } else {
      return res.status(403).json({ success: false, message: "Invalid role" });
    }

    const videos = await Video.find(filter).sort({ uploaded_at: -1 });

    res.json({ success: true, videos });
  } catch (err) {
    console.error("Fetch videos error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.secureStream = async (req, res) => {
  const { key } = req.params;
  const userId = req.user._id;

  try {
    const { data: videoData, error } = await supabase
      .from("video_versions")
      .select("task_id")
      .eq("video_url", `https://your-cloudflare-url-path/${key}`) // Complete URL in the eq method
      .single();

    if (error || !videoData) return res.status(404).send("Video not found");

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("creator_id, editor_id")
      .eq("_id", videoData.task_id)
      .single();

    if (taskErr || !task) return res.status(403).send("Access denied");

    const isAuthorized =
      task.creator_id === userId || task.editor_id === userId;

    if (!isAuthorized) {
      return res.status(403).send("Access denied to this video.");
    }

    const stream = s3
      .getObject({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `uploads/${key}`,
      })
      .createReadStream();

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "inline");
    stream.pipe(res);
  } catch (err) {
    console.error("Video stream error:", err.message);
    res.status(500).send("Internal error or video not found.");
  }
};
exports.fetchVideoVersions = async (req, res) => {
  const { taskId } = req.body;

  if (!taskId) {
    return res
      .status(400)
      .json({ error: "taskId is required in the request body" });
  }

  try {
    const { data, error } = await supabase
      .from("video_versions")
      .select("*")
      .eq("task_id", taskId)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ versions: data });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
