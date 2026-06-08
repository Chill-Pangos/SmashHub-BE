import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import config from "./config";

const storage = multer.diskStorage({
  destination: async (_, __, cb) => {
    try {
      await fs.mkdir(config.upload.avatarDir, { recursive: true });
      cb(null, config.upload.avatarDir);
    } catch (error) {
      cb(error as Error, config.upload.avatarDir);
    }
  },
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
