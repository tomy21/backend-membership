import MemberTenant from "../../model/Members/MemberTenants.js";
import { LocationMembers } from "../../model/Master/RefLocationMembers.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";
import TennantPurchaseHistory from "../../model/Members/v02/TenantPurchaseHistory.js";
import { col, fn, Op } from "sequelize";

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

    const summary = await VehicleList.findAll({
      attributes: ["tennant_code", [fn("COUNT", col("id")), "totalTenant"]],
      group: ["tennant_code"],
    });

    const summaryMap = {};

    summary.forEach((item) => {
      summaryMap[item.tennant_code] = item.dataValues.totalTenant;
    });

    // inject ke setiap row
    const dataWithCount = rows.map((row) => ({
      ...row.dataValues,
      totalTenant: summaryMap[row.tennant_code] || 0,
    }));

    res.status(200).json({
      statusCode: 200,
      total: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      data: dataWithCount,
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

export const getTennantPurchaseHistoryByUser = async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10, search = "" } = req.query;

  const offset = (page - 1) * limit;

  try {
    const whereClause = {
      user_id: userId,
      [Op.or]: [
        { virtual_account_number: { [Op.like]: `%${search}%` } },
        { virtual_account_name: { [Op.like]: `%${search}%` } },
        { trx_id: { [Op.like]: `%${search}%` } },
        { status_payment: { [Op.like]: `%${search}%` } },
        { status_progress: { [Op.like]: `%${search}%` } },
        { type_payment: { [Op.like]: `%${search}%` } },
      ],
    };

    const { rows, count } = await TennantPurchaseHistory.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching history by user:", error);
    res.status(500).json({ error: "Failed to fetch purchase history" });
  }
};

export const getValueByUser = async (req, res) => {
  const userId = req.userId;

  try {
    const cekTenantCode = await MemberTenant.findByPk(userId);

    const totalMembership = await res.status(200).json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching history by user:", error);
    res.status(500).json({ error: "Failed to fetch purchase history" });
  }
};

export const getPurchaseHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const month = parseInt(req.query.month); // ex: 9
    const year = parseInt(req.query.year); // ex: 2025

    let whereCondition = {};

    // kalau ada filter month & year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1); // awal bulan
      const endDate = new Date(year, month, 0, 23, 59, 59); // akhir bulan
      whereCondition = {
        updated_at: {
          [Op.between]: [startDate, endDate],
        },
      };
    } else if (year) {
      // filter by year saja
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      whereCondition = {
        periode: {
          [Op.between]: [startDate, endDate],
        },
      };
    }

    const { count, rows } = await TennantPurchaseHistory.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["updated_at", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      statusCode: 200,
      total: count,
      totalPages,
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error getPurchaseHistory:", error);
    res.status(500).json({ error: error.message });
  }
};
