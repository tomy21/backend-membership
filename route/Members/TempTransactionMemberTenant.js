import express from "express";
import {
  createTempTransactionMemberTenant,
  getAllTempTransactionMemberTenants,
  getTempTransactionMemberTenantById,
  updateTempTransactionMemberTenant,
  deleteTempTransactionMemberTenant,
} from "../../controller/Members/TempTransactionMemberTenants.js";

const router = express.Router();

router
  .route("/transactionTenants")
  .post(createTempTransactionMemberTenant)
  .get(getAllTempTransactionMemberTenants);

router
  .route("/transactionTenants/:id")
  .get(getTempTransactionMemberTenantById)
  .patch(updateTempTransactionMemberTenant)
  .delete(deleteTempTransactionMemberTenant);

export default router;
