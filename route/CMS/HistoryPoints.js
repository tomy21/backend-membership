import express from "express";
import {
  historyPoint,
  HistoryTransaction,
  userParkingByPoint,
} from "../../controller/Members/HistoryPoints.js";

const router = express.Router();

router.route("/get-points").get(historyPoint);
router.route("/detail-point/:id").get(userParkingByPoint);
router.route("/detail-transaction/:id").get(HistoryTransaction);

export default router;
