import express from "express";
import {
  createLocationMember,
  getLocationMembers,
  getLocationMemberById,
  updateLocationMember,
  deleteLocationMember,
} from "../../controller/Master/MemberLocations.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/location-members")
  .post(createLocationMember)
  .get(getLocationMembers);

router
  .route("/location-members/:id")
  .put(updateLocationMember)
  .get(getLocationMemberById)
  .delete(deleteLocationMember);

export default router;
