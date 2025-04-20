const crypto = require("crypto");


const algorithm = process.env.ENCRYPTION_ALGO;


const secretKey = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, "hex"); 


const ivLength = 12; 
const authTagLength = 16;


function encryptToken(token) {
  const iv = crypto.randomBytes(ivLength); 

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); 

  return {
    token: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}


function decryptToken(encryptedObj) {
  const { token, iv, authTag } = encryptedObj;

  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(token, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = {
  encryptToken,
  decryptToken,
};
