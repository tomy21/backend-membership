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
  .route("/history/transaction-virtualaccount/:noVa")
  .get(protect, trxHistoryPayment.getTrxStatusPaymentByVA);

router
  .route("/transactionStatus/:trxId")
  .get(trxHistoryPayment.getPaymentByTrxId);

router
  .route("/history/export-data")
  .get(trxHistoryPayment.exportHistoryTransaction);

//Transaction end

router.route("/history/payments").get(trxHistoryPayment.getPayment);
router
  .route("/history/export-data-payment")
  .get(trxHistoryPayment.exportHistoryPayment);
router
  .route("/history/get-history-user-byid/:id")
  .get(trxHistoryPayment.historyUsersById);
router
  .route("/history/get-history-location")
  .get(trxHistoryPayment.historyTransactionByLocation);

export default router;
