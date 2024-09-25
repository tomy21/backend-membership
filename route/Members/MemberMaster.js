import express from "express";
import { getMemberMasterData } from "../../controller/Members/MemberMaster.js";

const router = express.Router();

router.get("/member-master-data", getMemberMasterData);

export default router;
