import express from "express";
import {
  getAllMemberTenants,
  getMemberTenant,
  getTennantPurchaseHistoryByUser,
} from "../../controller/Members/MemberTenants.js";
import { loginTennant } from "../../controller/Members/AuthTenant.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.route("/tenant/login").post(loginTennant);
router.route("/tenant").get(getAllMemberTenants);
router.get("/tenant/history", protect, getTennantPurchaseHistoryByUser);
router.route("/tenant-members/:tennantCode").get(getMemberTenant);

export default router;
