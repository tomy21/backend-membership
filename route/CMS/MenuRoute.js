import express from "express";
import * as Menu from "../../controller/Master/Menu.js";
import * as RolePermission from "../../controller/Master/RolePermission.js";

const router = express.Router();

router.route("/get-menu-byrole/:roleId").get(Menu.getMenusByRole);
router.route("/get-menus").get(Menu.getMenus);

//role-permission
router.route("/add-role-permission").post(RolePermission.addRolePermission);
router
  .route("/add-role-permission-bulk")
  .post(RolePermission.addRolePermissionBulk);

// router
//     .route("/menu/:id")
//     .get(Menu.getMenuById)
//     .patch(Menu.updateMenu)
//     .delete(Menu.deleteMenu);

export default router;
