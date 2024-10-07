import express from "express";
import {
  register,
  login,
  logout,
  activateAccount,
  getUserById,
  getUserByIdDetail,
  getAllUsers,
  userRole,
  getRoles,
  getRoleById,
  updateUserDetails,
  requestPasswordReset,
  resetPassword,
} from "../../controller/Members/AuthController.js";
import { protect } from "../../middleware/member/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verifikasi", protect, getUserByIdDetail);
router.get("/logout", logout);

router.get("/userById", protect, getUserById);
router.get("/user", protect, getAllUsers);
router.patch("/user/:id", protect, getUserById);
router.get("/activate/:token", activateAccount);
router.put("/usersDetail", protect, updateUserDetails);

router.post("/role", protect, userRole);
router.get("/role", protect, getRoles);
router.get("/rolesDetail", protect, getRoleById);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

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
