import express from "express";
import * as ExportData from "../../controller/ExportData/ExportData.js";
import { protect } from "../../middleware/member/authMiddleware.js";
const router = express.Router();

router.get("/export-data-post", protect, ExportData.exportDataTransaksiPost);
router.get(
  "/export-data-transaction",
  // protect,
  ExportData.exportHistoryTransaction
);
router.get("/export-data-payment", ExportData.exportHistoryPayment);
router.get("/export-data-payment-b2b", ExportData.exportHistoryPaymentB2B);

router.get(
  "/export-data-points/:id",
  protect,
  ExportData.exportDataHistoryPointByUser
);
router.get(
  "/export-data-history/:locationCode",
  ExportData.exportDetailTransaksiLocation
);

export default router;
