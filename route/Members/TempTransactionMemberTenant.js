import express from "express";
import {
  createTempTransactionMemberTenant,
  getAllTempTransactionMemberTenants,
  getTempTransactionMemberTenantById,
  updateTempTransactionMemberTenant,
  deleteTempTransactionMemberTenant,
} from "../../controller/Members/TempTransactionMemberTenants.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/transactionTenants")
  .post(protect, createTempTransactionMemberTenant)
  .get(getAllTempTransactionMemberTenants);

router
  .route("/transactionTenants/:id")
  .get(getTempTransactionMemberTenantById)
  .patch(updateTempTransactionMemberTenant)
  .delete(deleteTempTransactionMemberTenant);

export default router;
