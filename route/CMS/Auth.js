import express from "express";
import * as Users from "../../controller/Members/AuthCMS.js";
import { protect } from "../../middleware/member/authMiddleware.js";
const router = express.Router();

router.post("/register-cms", Users.registerCMS);
router.post("/login-cms", Users.login);
router.get("/cms-userById", protect, Users.getUserByIdCMS);
router.get("/all-data-users", Users.getUserCMS);
router.delete("/delete-user/:id", Users.softDeleteUser);
router.post("/user-cms/restore/:id", Users.restoreUser);
router.get("/logout-cms", Users.logoutCMS);
router.get("/get-all-membership", Users.getAllMembership);
router.get("/get-location-membership", Users.getLocationMember);
router.post("/create-role", protect, Users.addRole);

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
