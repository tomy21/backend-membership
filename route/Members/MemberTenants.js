import express from "express";
import {
  getAllMemberTenants,
  getMemberTenant,
} from "../../controller/Members/MemberTenants.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.route("/tenant").get(getAllMemberTenants);
router.route("/tenant-members/:tennantCode").get(getMemberTenant);

export default router;
