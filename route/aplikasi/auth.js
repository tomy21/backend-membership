import express from "express";
import * as UserAplikasi from "../../controller/aplikasi/auth.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.post("/login-aplikasi", UserAplikasi.loginAplikasi);

router.use(protect);
router.get("/profile", UserAplikasi.getProfil);
router.get("/list-card-members", UserAplikasi.getCardByLocation);
router.get("/logout", UserAplikasi.logoutAplikasi);

export default router;