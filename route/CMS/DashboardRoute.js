import express from "express";
import {
  getMembershipStatistics,
  listSummaryLocation,
  totalValue,
} from "../../controller/Members/DashboardController.js";

const router = express.Router();

router.get("/memberships/statistics", getMembershipStatistics);
router.get("/memberships/dashboard-value", totalValue);
router.get("/memberships/location-member", listSummaryLocation);

export default router;
