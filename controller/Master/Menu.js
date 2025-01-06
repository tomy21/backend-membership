import { Op } from "sequelize";
import { errorResponse, successResponse } from "../../config/response.js";
import { MenuModels } from "../../model/Master/MenuModels.js";
import { RolePermission } from "../../model/Master/RolePermission.js";

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

export const getMenuWithSubmenus = async (req, res) => {
  try {
    const menus = await MenuModels.findAll({
      where: { parent_slug: null }, // Hanya menu utama
      include: [
        {
          model: MenuModels,
          as: "subMenus", // Ambil sub-menu
          include: [
            {
              model: RolePermission,
              as: "permission", // Ambil permission untuk sub-menu
            },
          ],
          group: ["role_id"],
        },
        {
          model: RolePermission,
          as: "permission", // Ambil permission untuk menu utama
        },
      ],
      order: [["position", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Menus retrieved successfully!",
      data: menus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving menus!",
      error: error.message,
    });
  }
};

export const getMenus = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const menus = await MenuModels.findAndCountAll({
      where: {
        parent_slug: null,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { slug: { [Op.like]: `%${search}%` } },
          { link: { [Op.like]: `%${search}%` } },
        ],
      }, // Hanya menu utama
      include: [
        {
          model: MenuModels,
          as: "subMenus", // Ambil sub-menu
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [["position", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Menus retrieved successfully!",
      totalItems: menus.count,
      totalPages: Math.ceil(menus.count / limit),
      currentPage: parseInt(page),
      data: menus.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving menus!",
      error: error.message,
    });
  }
};

export const getMenuById = async (req, res) => {
  const { id } = req.params;

  try {
    const menu = await MenuModels.findOne({
      where: { id },
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found!",
      });
    }

    return res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching menu!",
      error: error.message,
    });
  }
};

// controller/menusController.js

export const updateMenu = async (req, res) => {
  const { id } = req.params;
  const { name, link, parent_slug, icon } = req.body;

  try {
    const menu = await MenuModels.findOne({ where: { id } });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found!",
      });
    }

    menu.name = name || menu.name;
    menu.link = link || menu.link;
    menu.parent_slug = parent_slug || menu.parent_slug;
    menu.icon = icon || menu.icon;

    await menu.save();

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully!",
      data: menu,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating menu!",
      error: error.message,
    });
  }
};

// controller/menusController.js

export const deleteMenu = async (req, res) => {
  const { id } = req.params;

  try {
    const menu = await MenuModels.findOne({ where: { id } });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found!",
      });
    }

    await menu.destroy();

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting menu!",
      error: error.message,
    });
  }
};
