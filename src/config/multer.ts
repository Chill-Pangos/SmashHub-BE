import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import config from "./config";

const createImageStorage = (uploadDir: string) => multer.diskStorage({
  destination: async (_, __, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (_, file, cb) => {
    const hash = crypto.randomBytes(8).toString("hex");
    cb(null, `${hash}${path.extname(file.originalname)}`);
  },
});

const imageFileFilter: multer.Options["fileFilter"] = (_, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error("Only images allowed"));
};

export const avatarUpload = multer({
  storage: createImageStorage(config.upload.avatarDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});

export const paymentProofUpload = multer({
  storage: createImageStorage(config.upload.paymentDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});
