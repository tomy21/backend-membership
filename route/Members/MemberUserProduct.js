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

const router = express.Router();

router
  .route("/userProduct")
  .post(createMemberUserProduct)
  .get(getAllMemberUserProducts);

router.route("/userProduct/byUser").get(getMemberByUserId);
router.route("/userProduct/verifikasi").get(verifikasiPlat);

router
  .route("/userProduct/updateData/:id")
  .get(getMemberUserProduct)
  .patch(updateMemberUserProduct)
  .delete(deleteMemberUserProduct);

export default router;
