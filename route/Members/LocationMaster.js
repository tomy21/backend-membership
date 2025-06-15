import express from "express";
import * as LocationMaster from "../../controller/Master/LocationMaster.js";

const router = express.Router();

<<<<<<< HEAD
router.get("/location-master", LocationMaster.getAllLocationAreas);
=======
router.get("/location-master/getAll", LocationMaster.getAllLocationAreas);
>>>>>>> production_v2
router.get("/location-master/:id", LocationMaster.getLocationAreaById);
router.post("/location-master", LocationMaster.createLocationArea);
router.put("/location-master/:id", LocationMaster.updateLocationArea);
router.delete("/location-master/:id", LocationMaster.deleteLocationArea);

export default router;
