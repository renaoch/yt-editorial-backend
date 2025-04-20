
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();


const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.CLOUDFLARE_URL;


const r2 = new AWS.S3({
  endpoint: R2_ENDPOINT,
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});


async function uploadToR2(file, objectKey) {
  try {
    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: file.buffer,
      ContentType: "video/mp4",
      ContentDisposition: "inline",
    };

    
    await r2.putObject(params).promise();

    
    const signedUrl = r2.getSignedUrl("getObject", {
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Expires: 7 * 24 * 60 * 60, 
      ResponseContentDisposition: "inline",
      ResponseContentType: "video/mp4",
    });

    return signedUrl;
  } catch (err) {
    console.error("❌ Error uploading to R2:", err.message);
    throw new Error("Failed to upload video to R2");
  }
}

module.exports = {
  uploadToR2,
};
