import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 70 * 1024 * 1024,
  },
});
import { protect } from "../../middleware/member/authMiddleware.js";
import {
  getDetailSummary,
  getSummaryByMonthDetail,
  getSummaryByYear,
  processTxtContent,
} from "../../controller/Reconsiliasi/bayarin.controller.js";
import { processTxtContentNobu } from "../../controller/Reconsiliasi/nobu.controller.js";
import { exportDetailMutationBank } from "../../controller/ExportData/ExportData.js";

router.post(
  "/upload-mutasi",
  // protect,
  upload.single("file"),
  async (req, res) => {
    try {
      const fileContent = req.file.buffer.toString("utf-8");
      const userId = req.userId ?? null;

      const results = await processTxtContent(fileContent, userId);
      res.json({ success: true, data: results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post("/upload-excel", upload.single("file"), processTxtContentNobu);

router.get("/summary-by-year", getSummaryByYear);
router.get("/summary-by-month", getSummaryByMonthDetail);
router.get("/summary-detail", getDetailSummary);
router.get("/export-data-mutasi", exportDetailMutationBank);

export default router;
