import { MenuModels } from "./MenuModels";
import MemberUserRole from "./RoleModel";
import RolePermission from "./RolePermission";

MenuModels.hasMany(MenuModels, {
  as: "submenus",
  foreignKey: "parent_slug",
  sourceKey: "slug",
});

MenuModels.hasMany(RolePermission, {
  foreignKey: "menu_slug",
  sourceKey: "slug",
});
RolePermission.belongsTo(MenuModels, {
  foreignKey: "menu_slug",
  sourceKey: "slug",
});

RolePermission.belongsTo(MemberUserRole, {
  foreignKey: "role_id",
});
MemberUserRole.hasMany(RolePermission, {
  foreignKey: "role_id",
});

export { MenuModels, RolePermission, MemberUserRole };
