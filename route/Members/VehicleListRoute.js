// routes/v01/member/TrxMemberQuota.js
import express from "express";
import * as VehicleList from "../../controller/Members/VehicleList.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router
  .route("/vehicle-list/data")
  .get(VehicleList.getVehicles)
  .post(VehicleList.createVehicle);

router
  .route("/vehicle-list/by-userid")
  .get(protect, VehicleList.getVehiclesByUSerId);

router
  .route("/vehicle-list/by-userid/vehicle-unactive")
  .get(protect, VehicleList.getVehiclesByUserIdUnActive);

router.route("/vehicle-list/:type").get(protect, VehicleList.getVehiclesByType);

router
  .route("/vehicle-list/by-id/:id")
  .get(VehicleList.getById)
  .put(VehicleList.updateVehicle)
  .delete(VehicleList.deleteVehicle);

export default router;
