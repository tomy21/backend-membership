import express from "express";
import {
  getAllMemberTenants,
  getMemberTenant,
  getPurchaseHistory,
  getTennantPurchaseHistoryByUser,
} from "../../controller/Members/MemberTenants.js";
import { loginTennant } from "../../controller/Members/AuthTenant.js";
import { protect } from "../../middleware/member/authMiddleware.js";
import { getUserByUsername } from "../../controller/Members/AuthController.js";

const router = express.Router();

router.route("/login").post(loginTennant);
router.route("/getByUsername/:username").get(getUserByUsername);
router.route("/tenant").get(getAllMemberTenants);
router.get("/tenant/history", protect, getTennantPurchaseHistoryByUser);
router.route("/tenant-members/:tennantCode").get(getMemberTenant);
router.route("/tenant-transaction").get(getPurchaseHistory);

export default router;
