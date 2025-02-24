import express from "express";
import {
  getMembershipStatistics,
  totalValue,
} from "../../controller/Members/DashboardController.js";

const router = express.Router();

router.get("/memberships/statistics", getMembershipStatistics);
router.get("/memberships/dashboard-value", totalValue);

export default router;
