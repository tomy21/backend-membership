import express from "express";
import { protect } from "../../middleware/member/authMiddleware.js";
import { getTransaksi } from "../../controller/aplikasi/transaction.js";

const router = express.Router();

router.use(protect);
router.get("/transaksi-location", getTransaksi);

export default router;