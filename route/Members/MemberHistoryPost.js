import express from "express";
import {
  getAllMemberPoints,
  getMemberPointById,
  getMemberPointsByCardId,
} from "../../controller/Members/MemberHistoryPost.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

// Get all with pagination and search
router.get("/history-post", getAllMemberPoints);

// Get by ID
router.get("/history-post/getById", protect, getMemberPointById);

// Get by CardId
router.get("/history-post/card/:memberUserId", getMemberPointsByCardId);

export default router;
