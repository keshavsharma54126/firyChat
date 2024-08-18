import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dxj1jm6n7",
  api_key: process.env.CLOUDINARY_API_KEY || "778989686193111",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "LIX1kt_3BKONq0lL7orynnXVmKE",
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file uploaded successfully
    console.log("file uploaded successfully", res.url);
    return res.url;
  } catch (e) {
    fs.unlinkSync(localFilePath); //will remove teh locally saved temporary file as the  upload operation got failed
    return null;
  }
};

export default uploadOnCloudinary;
