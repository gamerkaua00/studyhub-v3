// StudyHub v3.1.1 — services/cloudinaryService.js
const cloudinary = require("cloudinary");
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder, public_id: filename, resource_type: "auto", quality: "auto:good" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

const deleteFile = async (publicId) => {
  try { await cloudinary.v2.uploader.destroy(publicId); }
  catch (err) { console.error("[Cloudinary] Erro ao deletar:", err.message); }
};

module.exports = { uploadBuffer, deleteFile };
