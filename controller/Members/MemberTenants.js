import MemberTenant from "../../model/Members/MemberTenants.js";
import { LocationMembers } from "../../model/Master/RefLocationMembers.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";

// Get all member tenants with pagination
export const getAllMemberTenants = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await MemberTenant.findAndCountAll({
      attributes: [
        "id",
        "tennant_code",
        "tennant_name",
        "address",
        "email",
        "username",
        "is_active",
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      statusCode: 200,
      total: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get member tenant by ID
export const getMemberTenant = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const tenantCode = req.params.tennantCode;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await VehicleList.findAndCountAll({
      where: { tennant_code: tenantCode },
      attributes: [
        "id",
        "plate_number",
        "vehicle_type",
        "cust_id",
        "member_customer_no",
        "rfid",
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      statusCode: 200,
      total: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
