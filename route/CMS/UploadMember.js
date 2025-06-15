import express from "express";
import { uploadMemberExcel } from "../../controller/uploadMember/uploadData.js";

const router = express.Router();

router.post("/upload-member", uploadMemberExcel);

export default router;
