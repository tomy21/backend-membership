import express from "express";

import { protect } from "../../../middleware/member/authMiddleware.js";
import {
  exportDataTransaksiPostById,
  exportHistoryPaymentByUser,
  exportHistoryPoint,
} from "../../../controller/ExportData/ExportData.js";
const router = express.Router();

router.get("/export-data-payment-byuser", protect, exportHistoryPaymentByUser);
router.get(
  "/export-data-transaction-byuser",
  protect,
  exportDataTransaksiPostById
);

router.get("/export-data-history-point", exportHistoryPoint);

export default router;
