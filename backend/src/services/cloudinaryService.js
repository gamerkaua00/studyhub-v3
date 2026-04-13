// StudyHub v3.1.3 — services/cloudinaryService.js
// Usa cloudinary v2 API corretamente
const cloudinary = require("cloudinary").v2;  // CORRETO: importa direto o .v2
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(  // sem .v2 pois já importamos .v2
      {
        folder,
        public_id: filename,
        resource_type: "image",
        access_mode: "public",
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] Upload falhou:", error.message);
          return reject(error);
        }
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary não retornou URL"));
        }
        console.log(`[Cloudinary] ✅ Upload OK: ${result.secure_url}`);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[Cloudinary] Erro ao deletar:", err.message);
  }
};

module.exports = { uploadBuffer, deleteFile };
