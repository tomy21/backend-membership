import express from "express";
import {
  createMemberUserProduct,
  getAllMemberUserProducts,
  getMemberUserProduct,
  updateMemberUserProduct,
  deleteMemberUserProduct,
  getMemberByUserId,
  verifikasiPlat,
} from "../../controller/Members/MemberUserProduct.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/userProduct")
  .post(createMemberUserProduct)
  .get(getAllMemberUserProducts);

router.route("/userProduct/byUser").get(protect, getMemberByUserId);
router.route("/userProduct/verifikasi").get(verifikasiPlat);

router
  .route("/userProduct/updateData")
  .get(protect, getMemberUserProduct)
  .patch(protect, updateMemberUserProduct)
  .delete(protect, deleteMemberUserProduct);

export default router;
