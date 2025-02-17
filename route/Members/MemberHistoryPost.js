import express from "express";
import * as History from "../../controller/Members/HistoryPost.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

// Get all with pagination and search
router.get("/history-post", protect, History.HistoryPostController);
router.get("/history-post-all", protect, History.AllTransaction);
router.get("/export-data", protect, History.exportDataTransaksiPost);

export default router;
