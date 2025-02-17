import express from "express";
import * as Users from "../../controller/Members/AuthController.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.post("/register", Users.register);
router.post("/login", Users.login);
router.post("/verifikasi", protect, Users.getUserByIdDetail);
router.get("/logout", Users.logout);

router.get("/userById", protect, Users.getUserById);
router.get("/user", protect, Users.getAllUsers);
router.patch("/user/:id", protect, Users.getUserById);
router.get("/activate/:token", Users.activateAccount);

router.post("/request-email-verification", Users.requestTokenActivation);

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
