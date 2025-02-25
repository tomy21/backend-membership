import express from "express";
import {
  createMemberProductBundle,
  getAllMemberProductBundles,
  getMemberProductBundle,
  updateMemberProductBundle,
  deleteMemberProductBundle,
  getProductByType,
  getProductByIdProduct,
} from "../../controller/Members/MemberProductBundle.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/memberProductBundles")
  .post(protect, createMemberProductBundle)
  .get(getAllMemberProductBundles);
router.get("/products/type/:vehicleType", getProductByType);
router.route("/product/getByProductId/:id").get(getProductByIdProduct);
router
  .route("/memberProductBundles/:id")
  .get(getMemberProductBundle)
  .put(protect, updateMemberProductBundle);

router
  .route("/memberProductBundles/delete/:id")
  .put(protect, deleteMemberProductBundle);

export default router;
