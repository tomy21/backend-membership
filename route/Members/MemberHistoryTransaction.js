import express from "express";
import {
  createMemberHistoryTransaction,
  getAllMemberHistoryTransactions,
  getMemberHistoryTransaction,
  getHistoryByUserId,
} from "../../controller/Members/MemberHistoryTransaction.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/memberHistoryTransactions")
  .post(createMemberHistoryTransaction)
  .get(getAllMemberHistoryTransactions);

router
  .route("/memberHistoryTransactions")
  .get(protect, getMemberHistoryTransaction);
router.route("/memberHistory/users").get(protect, getHistoryByUserId);

export default router;
