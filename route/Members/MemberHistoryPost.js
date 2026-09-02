import express from "express";
import * as History from "../../controller/Members/HistoryPost.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

// Get all with pagination and search
router.get("/history-post", protect, History.HistoryPostController);
router.get("/history-post-all", History.AllTransaction);
router.route("/history-post-casual").get(protect, History.transactionsCasual);

export default router;
