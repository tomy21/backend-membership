import { Op } from "sequelize";
import { errorResponse, successResponse } from "../../config/response.js";
import { MenuModels } from "../../model/Master/MenuModels.js";
import { RolePermission } from "../../model/Master/RolePermission.js";
import { menuCMS } from "../../model/Master/Menu.js";

export const createMenu = async (req, res) => {
  const { name, link, parent_slug, icon, position, slug, created_by } =
    req.body;
  try {
    const newMenu = await MenuModels.create({
      name,
      link,
      parent_slug,
      icon,
      position,
      slug,
      created_by,
    });
    successResponse(res, 200, "Success", newMenu);
  } catch (error) {
    errorResponse(res, 500, "Failed", error.message);
  }
};

export const getMenusByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const menus = await MenuModels.findAll({
      where: { parent_slug: null }, // menu utama
      include: [
        {
          model: MenuModels,
          as: "subMenus",
          required: false, // biar semua sub menu muncul
          include: [
            {
              model: RolePermission,
              as: "permissions",
              where: { role_id: roleId },
              required: false, // biar tetap muncul walau belum ada permission
            },
          ],
        },
        {
          model: RolePermission,
          as: "permissions",
          where: { role_id: roleId },
          required: true,
        },
      ],
      order: [["position", "ASC"]],
    });

    res.status(200).json({
      message: "Success get menus by role",
      data: menus,
    });
  } catch (err) {
    console.error("Error getMenusByRole:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getMenus = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Hitung total parent menu
    const total = await MenuModels.count({
      where: { parent_slug: null },
    });

    // Ambil data sesuai pagination
    const menus = await MenuModels.findAll({
      where: { parent_slug: null },
      include: [
        {
          model: MenuModels,
          as: "subMenus",
          required: false,
        },
      ],
      order: [["position", "ASC"]],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      message: "Success get all menus",
      data: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        menus,
      },
    });
  } catch (err) {
    console.error("Error getAllMenusController:", err);
    res.status(500).json({
      message: "Failed get all menus",
      error: err.message,
    });
  }
};

export const getMenusByParent = async (req, res) => {
  try {
    const { parent_slug } = req.query;
    const roleId = req.roleId;

    console.log(roleId);

    if (roleId !== 1 && parent_slug === "master") {
      return res.status(400).json({
        status: false,
        message: "Role ini tidak ada akses ke master",
      })
    }

    if (!parent_slug) {
      return res.status(400).json({
        message: "parent_slug is required",
      });
    }

    const menus = await menuCMS.findAll({
      where: {
        parent_slug,
      },
      order: [["position", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    console.error("getMenusByParent error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
