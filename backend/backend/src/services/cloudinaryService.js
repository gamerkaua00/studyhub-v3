// ============================================================
// StudyHub v3 — services/cloudinaryService.js
// Configuração e helpers do Cloudinary para upload de fotos
// ============================================================

const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz upload de um buffer (arquivo em memória) para o Cloudinary
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} folder - Pasta no Cloudinary (ex: "studyhub/fisica")
 * @param {string} filename - Nome público do arquivo
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBuffer = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: "auto",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Deleta um arquivo do Cloudinary pelo publicId
 */
const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[Cloudinary] Erro ao deletar:", err.message);
  }
};

module.exports = { uploadBuffer, deleteFile, cloudinary };
