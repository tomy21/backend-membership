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
router.post("/verifikasi", getUserByIdDetail);
router.get("/logout", logout);
router.get("/user/:id", getUserById);
router.get("/user", getAllUsers);
router.patch("/user/:id", getUserById);
router.get("/activate/:token", activateAccount);
router.put("/usersDetail/:id", updateUserDetails);

router.post("/role", userRole);
router.get("/role", getRoles);
router.get("/rolesDetail/:id", getRoleById);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.get("/protected", protect, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "You have access to this route",
  });
});

export default router;
