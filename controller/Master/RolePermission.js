import { MenuModels } from "../../model/Master/MenuModels.js";
import { MemberUserRole } from "../../model/Master/RoleModel.js";
import { RolePermission } from "../../model/Master/RolePermission.js";

export const addRolePermission = async (req, res) => {
  try {
    const {
      role_id,
      menu_slug,
      can_view,
      can_create,
      can_update,
      can_delete,
      can_report,
    } = req.body;

    // cek role valid?
    const role = await MemberUserRole.findByPk(role_id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // cek menu valid?
    const menu = await MenuModels.findOne({ where: { slug: menu_slug } });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    // cek apakah sudah ada permission untuk role + menu
    const existing = await RolePermission.findOne({
      where: { role_id, menu_slug },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Permission already exists for this role & menu" });
    }

    // insert baru
    const permission = await RolePermission.create({
      role_id,
      menu_slug,
      can_view: can_view ?? false,
      can_create: can_create ?? false,
      can_update: can_update ?? false,
      can_delete: can_delete ?? false,
      can_report: can_report ?? false,
    });

    return res.status(201).json({
      message: "Role Permission created successfully",
      data: permission,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const addRolePermissionBulk = async (req, res) => {
  try {
    const { permissions } = req.body; // array of role permissions
    // lakukan bulk insert atau upsert
    await RolePermission.bulkCreate(permissions, {
      updateOnDuplicate: [
        "can_view",
        "can_create",
        "can_update",
        "can_delete",
        "can_report",
      ],
    });
    res.json({ success: true, message: "Permissions saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
