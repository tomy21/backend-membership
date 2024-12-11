import express from "express";
import * as trxHistoryPayment from "../../controller/Members/TrxMemberPayment.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/history/payments")
  .get(trxHistoryPayment.getTransactions)
  .post(trxHistoryPayment.createTransaction);

router
  .route("/history/payments-byid/:id")
  .patch(trxHistoryPayment.updateTransaction)
  .delete(trxHistoryPayment.deleteTransaction);

router
  .route("/history/payment-detail")
  .get(protect, trxHistoryPayment.getTransactionByUserId);
router.route("/paymentStatus/:trxId").get(trxHistoryPayment.getPaymentByTrxId);

export default router;
