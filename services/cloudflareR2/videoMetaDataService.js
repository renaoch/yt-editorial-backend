
const Video = require("../../models/Video");


async function saveVideoReference({
  creatorId,
  editorId,
  url,
  filename,
  title = "",
  description = "",
}) {
  try {
    const newVideo = new Video({
      creator_id: creatorId,
      editor_id: editorId,
      url,
      filename,
      title,
      description,
      status: "pending",
      uploaded_at: new Date(),
    });

    
    await newVideo.save();
    console.log("✅ Video saved to DB using Video model");

    return newVideo;
  } catch (err) {
    console.error("❌ Error saving video:", err.message);
    throw new Error("Failed to save video metadata");
  }
}

module.exports = {
  saveVideoReference,
};
