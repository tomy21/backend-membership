import { Op } from "sequelize";
import { errorResponse, successResponse } from "../../config/response.js";
import { MemberUserRole } from "../../model/Master/RoleModel.js";
import { RolePermission } from "../../model/Master/RolePermission.js";
import { MenuModels } from "../../model/Master/MenuModels.js";

// Get roles
export const getRole = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * parseInt(limit);
  try {
    const roles = await MemberUserRole.findAndCountAll({
      where: {
        [Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
      },
      attributes: [
        "id",
        "name",
        "created_at",
        "created_by",
        "updated_at",
        "modified_by",
      ],
      limit: parseInt(limit),
      offset,
    });

    if (!roles) {
      return res.status(404).json({
        statusCode: 404,
        message: "No users found with that ID",
      });
    }
    res.status(200).json({
      totalItems: roles.count,
      totalPages: Math.ceil(roles.count / limit),
      currentPage: parseInt(page),
      data: roles.rows,
    });
  } catch (error) {
    return errorResponse(res, 500, "Error fetching roles", error.message);
  }
};

// Get permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = await RolePermission.findAll();

    const groupedPermissions = permissions.reduce((result, permission) => {
      const { menu_list, link, action_name, permissions: actions } = permission;

      let category = result.find((item) => item.category === menu_list);

      if (!category) {
        category = { category: menu_list, link, actions: [] };
        result.push(category);
      }

      category.actions.push({
        name: action_name,
        permissions: actions,
      });

      return result;
    }, []);

    return res.status(200).json(groupedPermissions);
  } catch (error) {
    return errorResponse(res, 500, "Error fetching permissions", error.message);
  }
};

// Create a permission
export const createPermission = async (req, res) => {
  try {
    const { menu_list, link, action_name, permissions, created_by } = req.body;

    if (!menu_list || !link || !action_name || !permissions || !created_by) {
      return errorResponse(res, 400, "All fields are required");
    }

    const permission = await RolePermission.create({
      menu_list,
      link,
      action_name,
      permissions: JSON.stringify(permissions), // Simpan sebagai JSON
      created_by,
    });

    return successResponse(
      res,
      201,
      "Permission created successfully",
      permission
    );
  } catch (error) {
    return errorResponse(res, 500, "Error creating permission", error.message);
  }
};

// Get role permissions data
export const getRolePermissionsData = async (req, res) => {
  try {
    const permissions = await RolePermission.findAll({
      attributes: ["menu_slug", "link", "action_name", "permissions"],
      order: [["menu_slug", "ASC"]],
    });

    const formattedData = permissions.reduce((result, permission) => {
      const { menu_list, link, action_name, permissions: actions } = permission;

      let category = result.find((item) => item.category === menu_list);

      if (!category) {
        category = { category: menu_list, link, actions: [] };
        result.push(category);
      }

      category.actions.push({
        name: action_name,
        permissions: actions,
      });

      return result;
    }, []);

    return successResponse(
      res,
      200,
      "Role permissions retrieved successfully",
      formattedData
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Error fetching role permissions",
      error.message
    );
  }
};

export const getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermission.findAll({
      include: [
        { model: MemberUserRole, attributes: ["id", "name"] },
        { model: MenuModels, as: "menu" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Role permissions retrieved successfully!",
      data: rolePermissions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve role permissions!",
      error: error.message,
    });
  }
};

export const getRolePermissionsById = async (req, res) => {
  const { roleId } = req.params;

  try {
    // Pastikan roleId valid
    const role = await MemberUserRole.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role tidak ditemukan" });
    }

    // Ambil menu berdasarkan roleId
    const menus = await MenuModels.findAll({
      include: [
        {
          model: RolePermission,
          as: "permissions",
          where: { role_id: roleId },
          attributes: [
            "can_view",
            "can_create",
            "can_update",
            "can_delete",
            "can_report",
          ],
          required: false,
        },
        {
          model: MenuModels,
          as: "subMenus", // Untuk mengambil sub menu
          include: [
            {
              model: RolePermission,
              as: "permissions",
              where: { role_id: roleId },
              attributes: [
                "can_view",
                "can_create",
                "can_update",
                "can_delete",
                "can_report",
              ],
              required: false,
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Role permissions retrieved successfully!",
      data: menus,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
