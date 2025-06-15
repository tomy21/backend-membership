import express from "express";
import * as Menu from "../../controller/Master/Menu.js";

const router = express.Router();

router.route("/menu-all").get(Menu.getMenus);

router.route("/get-all-menu").get(Menu.getAllMenus);

router.route("/menu-byId/:id").get(Menu.getMenuById);

// router
//     .route("/menu/:id")
//     .get(Menu.getMenuById)
//     .patch(Menu.updateMenu)
//     .delete(Menu.deleteMenu);

export default router;
