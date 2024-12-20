import express from "express";
import * as trxHistoryPayment from "../../controller/Members/TrxMemberPayment.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/history/payments")
  .get(trxHistoryPayment.getTransactions)
  .get(trxHistoryPayment.getTrxStatusPayment)
  .post(trxHistoryPayment.createTransaction);

router
  .route("/history/payments-detail")
  .get(trxHistoryPayment.getTrxStatusPayment);

router
  .route("/history/payments-byid/:id")
  .patch(trxHistoryPayment.updateTransaction)
  .delete(trxHistoryPayment.deleteTransaction);

router
  .route("/history/payments-byuser")
  .get(protect, trxHistoryPayment.getTransactionByUserId);

router.route("/paymentStatus/:trxId").get(trxHistoryPayment.getPaymentByTrxId);

export default router;
