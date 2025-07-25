import express from "express";
import { historyPointUsed } from "../../controller/Members/MemberHistoryTransaction.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.route("/history-point").get(historyPointUsed);

export default router;
