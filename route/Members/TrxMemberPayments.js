import express from "express";
import * as trxHistoryPayment from "../../controller/Members/TrxMemberPayment.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

//transaction History
router
  .route("/history/transaction")
  .get(trxHistoryPayment.getTransactions)
  .post(trxHistoryPayment.createTransaction);

router
  .route("/history/payment-status")
  .get(trxHistoryPayment.getTrxStatusPayment);

router
  .route("/history/transaction-detail")
  .get(trxHistoryPayment.getTrxStatusPayment);

router
  .route("/history/transaction-byid/:id")
  .patch(trxHistoryPayment.updateTransaction)
  .delete(trxHistoryPayment.deleteTransaction);

router
  .route("/history/transaction-byuser")
  .get(protect, trxHistoryPayment.getTransactionByUserId);

router
  .route("/transactionStatus/:trxId")
  .get(trxHistoryPayment.getPaymentByTrxId);

//Transaction end

router.route("/history/payments").get(trxHistoryPayment.getPayment);

export default router;
