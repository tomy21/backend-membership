import express from "express";
import {
  getAllMemberTenants,
  getMemberTenantById,
  createMemberTenant,
  updateMemberTenant,
  deleteMemberTenant,
} from "../../controller/Members/MemberTenants.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/tenant")
  .post(protect, createMemberTenant)
  .get(getAllMemberTenants);

router
  .route("/tenant/:id")
  .get(getMemberTenantById)
  .patch(updateMemberTenant)
  .delete(deleteMemberTenant);

export default router;
