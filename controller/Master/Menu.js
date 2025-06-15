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

export const getAllMenus = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: parents } = await MenuModels.findAndCountAll({
      where: {
        parent_slug: null,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { slug: { [Op.like]: `%${search}%` } },
          { link: { [Op.like]: `%${search}%` } },
        ],
      },
      include: [
        {
          model: MenuModels,
          as: "subMenus", // sesuai relasi kamu sebelumnya
        },
      ],
      order: [["position", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      status: "success",
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: parents,
    });
  } catch (err) {
    console.error("Error getAllMenus:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

export const getMenus = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Ambil semua menu dan relasi submenu-nya
    const menus = await MenuModels.findAll({
      where: { parent_slug: null },
      include: [
        {
          model: MenuModels,
          as: "subMenus",
        },
      ],
      order: [["position", "ASC"]],
    });

    // Format data sesuai kebutuhan frontend
    const formatted = menus.map((menu) => {
      if (menu.subMenus && menu.subMenus.length > 0) {
        return {
          icon: menu.icon,
          name: menu.name,
          subItems: menu.subMenus.map((sub) => ({
            name: sub.name,
            path: sub.link,
            pro: false,
          })),
        };
      } else {
        return {
          icon: menu.icon,
          name: menu.name,
          path: menu.link,
        };
      }
    });

    return res.status(200).json({
      status: "success",
      data: formatted,
    });
  } catch (err) {
    console.error("Error fetching menus:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
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
