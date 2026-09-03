import { v2 as cloudinary } from "cloudinary";

/**
 * Configure Cloudinary with environment credentials
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
  return cloudinary;
};

/**
 * Upload a file path, base64, or URL to Cloudinary
 */
export const uploadToCloudinary = async (file, folder = "everbloom_cafe") => {
  try {
    const instance = configureCloudinary();
    const result = await instance.uploader.upload(file, {
      folder,
      resource_type: "auto",
    });
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload a memory buffer (from multer memoryStorage) to Cloudinary
 */
export const uploadBufferToCloudinary = (buffer, folder = "everbloom_cafe") => {
  const instance = configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = instance.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary stream upload failed: ${error.message}`));
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by public_id
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    const instance = configureCloudinary();
    await instance.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Cloudinary deletion error for ${publicId}:`, error.message);
  }
};

export default cloudinary;
