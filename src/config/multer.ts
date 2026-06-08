import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads/avatars"),
  filename: (_, file, cb) => {
    const hash = crypto.randomBytes(8).toString("hex");
    cb(null, `${hash}${path.extname(file.originalname)}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error("Only images allowed"));
  },
});