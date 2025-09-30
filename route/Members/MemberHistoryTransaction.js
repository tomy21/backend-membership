import express from "express";
import {
  getUserPointHistory,
  historyPointUsed,
} from "../../controller/Members/MemberHistoryTransaction.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.route("/history-point").get(historyPointUsed);
router.route("/riwayat-point-byuser").get(getUserPointHistory);

export default router;
