import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/image", upload.single("image"), async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer, "navjivan-test");
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
