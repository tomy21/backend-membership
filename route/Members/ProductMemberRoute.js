import express from "express";
import {
  createMemberProduct,
  getAllMemberProducts,
  getMemberProduct,
  updateMemberProduct,
  deleteMemberProduct,
  getMemberProductByLocation,
  getMemberProductTypeVihecle,
} from "../../controller/Members/ProductMembers.js";

const router = express.Router();

router.route("/product").post(createMemberProduct).get(getAllMemberProducts);
router.route("/product/byLocation").get(getMemberProductByLocation);
router.route("/product/byType").get(getMemberProductTypeVihecle);
router
  .route("/product/:id")
  .get(getMemberProduct)
  .patch(updateMemberProduct)
  .delete(deleteMemberProduct);

export default router;
