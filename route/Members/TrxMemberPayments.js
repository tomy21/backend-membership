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
  .route("/history/transaction-topup")
  .get(trxHistoryPayment.getTransactionsTopup);

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
  .route("/history/transaction-byidtrx/:idTrx")
  .get(protect, trxHistoryPayment.getTrxStatusPaymentByTrxid);

router
  .route("/transactionStatus/:trxId")
  .get(trxHistoryPayment.getPaymentByTrxId);

router
  .route("/history/transaction-history-bylocation/:locationCode")
  .get(trxHistoryPayment.transactionByLocation);

//Transaction end

router.route("/history/payments").get(trxHistoryPayment.getPayment);

router
  .route("/history/get-history-user-byid/:id")
  .get(trxHistoryPayment.historyUsersById);
router
  .route("/history/get-history-location")
  .get(trxHistoryPayment.historyTransactionByLocation);

router.route("/history/get-year").get(trxHistoryPayment.getYearHistory);

export default router;
