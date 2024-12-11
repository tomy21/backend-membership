import express from "express";
import * as ProductMaster from "../../../controller/Master/ProductMembership.js";

const router = express.Router();

router
  .route("/product")
  .post(ProductMaster.createProductMember)
  .get(ProductMaster.getAllProductMembers);

router.route("/product-byLocation/:code").get(ProductMaster.getByLocationCode);

router
  .route("/product/:id")
  .get(ProductMaster.getProductMemberById)
  .patch(ProductMaster.updateProductMember)
  .delete(ProductMaster.deleteProductMember);

export default router;
