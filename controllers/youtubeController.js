const { google } = require("googleapis");
const stream = require("stream");
const axios = require("axios");


async function streamFromR2AndUploadToYouTube(
  r2PresignedUrl,
  { title, description, privacyStatus = "unlisted" },
  oauth2Client
) {
  const response = await axios({
    method: "get",
    url: r2PresignedUrl,
    responseType: "stream",
  });

  const passthrough = new stream.PassThrough();
  response.data.pipe(passthrough);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const res = await youtube.videos.insert({
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

  return res.data;
}
exports.approveAndUploadToYouTube = async (req, res) => {
  console.log("req.user: ", req.user);
  console.log("req.session: ", req.session);
  console.log("req.session.accessToken: ", req.session.accessToken);

  if (!req.user || !req.session || !req.session.accessToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing user or access token.",
    });
  }

  const access_token = req.session.accessToken;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  oauth2Client.setCredentials({ access_token });

  try {
    const { r2PresignedUrl, title, description } = req.body;

    if (!r2PresignedUrl || !title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: r2PresignedUrl or title",
      });
    }

    const uploaded = await streamFromR2AndUploadToYouTube(
      r2PresignedUrl,
      { title, description },
      oauth2Client
    );

    return res.status(200).json({
      success: true,
      youtubeVideoId: uploaded.id,
      message: "Video uploaded and approved.",
    });
  } catch (err) {
    console.error("YouTube Upload Error:", err.message);

    if (axios.isAxiosError(err)) {
      
      if (err.response) {
        
        console.error("Axios Error Response Data:", err.response.data);
        console.error("Axios Error Response Status:", err.response.status);
        console.error("Axios Error Response Headers:", err.response.headers);
      } else if (err.request) {
        
        console.error("Axios Error Request Data:", err.request);
      } else {
        
        console.error("Axios Error Message:", err.message);
      }
    } else {
      
      console.error("General Error:", err);
    }

    return res.status(500).json({
      success: false,
      error: "Upload failed",
      details: err.message,
      
      extraDetails: err.response ? err.response.data : null,
    });
  }
};
