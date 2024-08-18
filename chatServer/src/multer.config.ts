import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const checkFileType = (
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|avi|mov/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"));
  }
};

// Initialize upload variable
const upload = multer({
  storage,
  limits: { fileSize: 50000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

export default upload;
