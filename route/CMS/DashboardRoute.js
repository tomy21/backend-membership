import express from "express";
import {
  getMembershipStatistics,
  getMembershipStatisticsByRange,
  listSummaryLocation,
  summaryByProduct,
  totalValue,
} from "../../controller/Members/DashboardController.js";

const router = express.Router();

router.get("/memberships/statistics", getMembershipStatistics);
router.get("/memberships/statistics-range", getMembershipStatisticsByRange);
router.get("/memberships/dashboard-value", totalValue);
router.get("/memberships/location-member", listSummaryLocation);
router.get("/memberships/summary-by-product", summaryByProduct);

export default router;
