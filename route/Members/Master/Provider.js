import express from "express";
import * as Provider from "../../../controller/Master/Provider.js";

const router = express.Router();

router
  .route("/provider")
  .post(Provider.createProviderPayment)
  .get(Provider.getAllProviderPayments);

router.route("/provider/byType").get(Provider.getByTypePayment);

router
  .route("/provider/:id")
  .get(Provider.getProviderPaymentById)
  .patch(Provider.updateProviderPayment)
  .delete(Provider.deleteProviderPayment);

export default router;
