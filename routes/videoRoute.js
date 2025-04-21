const express = require("express");
const getAuthenticatedUser = require("../middlewares/userAuth");
const videoController = require("../controllers/videoController");
const youtubeController = require("../controllers/youtubeController");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  "/upload-video",
  getAuthenticatedUser,
  upload.single("file"),
  videoController.uploadVideo
);

router.get("/my-videos", getAuthenticatedUser, videoController.getMyVideos);
router.get(
  "/secure-video/:key",
  getAuthenticatedUser,
  videoController.secureStream
);

router.post(
  "/upload-youtube",
  getAuthenticatedUser,
  youtubeController.approveAndUploadToYouTube
);

router.post(
  "/video-versions",
  getAuthenticatedUser,
  videoController.fetchVideoVersions
);

module.exports = router;
