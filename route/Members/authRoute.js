import express from "express";
import * as Users from "../../controller/Members/AuthController.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.post("/register", Users.register);
router.post("/register-encrypt", Users.registerEncrypt);
router.post("/login", Users.login);
router.post("/verifikasi", protect, Users.getUserByIdDetail);
router.get("/logout", Users.logout);

router.get("/userById", protect, Users.getUserById);
router.get("/user", protect, Users.getAllUsers);
router.patch("/user/:id", protect, Users.getUserById);
router.get("/activate/:token", Users.activateAccount);
router.get("/activate-account-cms/:token", Users.activateAccountCMS);
router.get("/list-card-members", protect, Users.getCardDetail);
router.get("/find-card-plat", Users.getAllCardOrPlat);
router.get("/list-card-members/:rfid", protect, Users.getListCardDetail);


router.post("/request-email-verification", Users.requestTokenActivation);
router.post("/request-reset-password", Users.requestResetPassword);
router.post("/request-reset-pin", protect, Users.requestResetPin);
router.post("/request-change-password", Users.changePassword);
router.post("/request-change-pin", Users.changePin);

router.get("/protected", protect, (req, res) => {
  const token = req.cookies.refreshToken;
  res.status(200).json({
    statusCode: 200,
    status: "success",
    message: "You have access to this route",
    token: token,
  });
});

export default router;
