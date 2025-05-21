import express from "express";

import { protect } from "../../../middleware/member/authMiddleware.js";
import {
  exportDataTransaksiPostById,
  exportHistoryPaymentByUser,
} from "../../../controller/ExportData/ExportData.js";
const router = express.Router();

router.get("/export-data-payment-byuser", protect, exportHistoryPaymentByUser);
router.get(
  "/export-data-transaction-byuser",
  protect,
  exportDataTransaksiPostById
);

export default router;
