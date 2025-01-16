import express from "express";
import * as RolePermission from "../../controller/Members/RolePermision.js";

const router = express.Router();

router
  .route("/getAll-role")
  // .post(RolePermission.createRolePermission)
  .get(RolePermission.getRole);

router.route("/role-permission").get(RolePermission.getPermissions);
router.route("/menu-role-permission").get(RolePermission.getAllRolePermissions);
router
  .route("/menu-role-permission/:roleId")
  .get(RolePermission.getRolePermissionsById);

// router
//     .route("/role-permission/:id")
//     .get(RolePermission.getRolePermissionById)
//     .patch(RolePermission.updateRolePermission)
//     .delete(RolePermission.deleteRolePermission);

export default router;
