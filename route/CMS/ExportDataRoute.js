import express from "express";
import * as ExportData from "../../controller/ExportData/ExportData.js";
import { protect } from "../../middleware/member/authMiddleware.js";
const router = express.Router();

router.get("/export-data-post", protect, ExportData.exportDataTransaksiPost);
router.get(
  "/export-data-transaction",
  protect,
  ExportData.exportHistoryTransaction
);
router.get("/export-data-payment", protect, ExportData.exportHistoryPayment);

router.get(
  "/export-data-points/:id",
  protect,
  ExportData.exportDataHistoryPointByUser
);

export default router;
