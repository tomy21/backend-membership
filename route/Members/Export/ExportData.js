import express from "express";

import { protect } from "../../../middleware/member/authMiddleware.js";
import { exportHistoryPaymentByUser } from "../../../controller/ExportData/ExportData.js";
const router = express.Router();

router.get("/export-data-payment-byuser", protect, exportHistoryPaymentByUser);

export default router;
