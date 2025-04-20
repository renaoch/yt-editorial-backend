const axios = require("axios");
const { google } = require("googleapis");
const stream = require("stream");
const dotenv = require("dotenv");
dotenv.config();




let oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

let youtubeClient = null;




function setYouTubeTokens({ access_token, refresh_token }) {
  oauth2Client.setCredentials({
    access_token,
    refresh_token,
  });

  youtubeClient = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  console.log("✅ YouTube tokens set.");
}




function getYouTubeClient() {
  if (!youtubeClient) {
    throw new Error(
      "YouTube client not initialized. Call setYouTubeTokens first."
    );
  }
  return youtubeClient;
}




async function streamFromR2AndUpload(
  r2PresignedUrl,
  { title, description, privacyStatus = "unlisted" }
) {
  try {
    console.log("📡 Fetching video stream from R2:", r2PresignedUrl);

    const r2Response = await axios({
      method: "GET",
      url: r2PresignedUrl,
      responseType: "stream",
    });

    const passthrough = new stream.PassThrough();
    r2Response.data.pipe(passthrough);

    
    await oauth2Client.getAccessToken();

    console.log("⏫ Uploading to YouTube...");
    const response = await youtubeClient.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus },
      },
      media: {
        mimeType: "video/mp4",
        body: passthrough,
      },
    });

    console.log("✅ Upload complete. Video ID:", response.data.id);
    return response.data;
  } catch (error) {
    console.error("❌ YouTube upload failed:", error.message || error);
    throw new Error("YouTube upload failed");
  }
}

module.exports = {
  setYouTubeTokens,
  getYouTubeClient,
  streamFromR2AndUpload,
};
