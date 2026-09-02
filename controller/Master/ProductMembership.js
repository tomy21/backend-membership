import { Op, Sequelize } from "sequelize";
import ProductMembership from "../../model/Members/v02/ProductMembership.js";
import moment from "moment";
import { LocationMembers } from "../../model/Master/RefLocationMembers.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";

export const getAllProductMembers = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  try {
    const offset = (page - 1) * limit;
    const { count, rows } = await ProductMembership.findAndCountAll({
      where: {
        [Op.or]: [{ product_name: { [Op.like]: `%${search}%` } }],
      },
      attributes: [
        "id",
        "product_code",
        "product_name",
        "vehicle_type",
        "location_code",
        "price",
        "card_activation_fee",
        "start_date",
        "end_date",
        "Fee",
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      include: [
        {
          model: LocationArea,
          attributes: ["location_name"],
        },
      ],
    });

    res.json({
      status: "success",
      message: "Data fetched successfully",
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Location Area by ID
export const getProductMemberById = async (req, res) => {
  const { id } = req.params;
  try {
    const ProductMember = await ProductMembership.findByPk(id);
    if (!ProductMember) {
      return res.status(404).json({ message: "Location Area not found" });
    }
    res.json(ProductMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getByLocationCode = async (req, res) => {
  const { code } = req.params;
  const { page = 1, limit = 10, search = "" } = req.query;

  try {
    const offset = (page - 1) * limit;
    const { count, rows } = await ProductMembership.findAndCountAll({
      where: {
        location_code: code,
        [Op.or]: [{ product_name: { [Op.like]: `%${search}%` } }],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      group: ["vehicle_type"],
      order: [["created_at", "DESC"]],
    });

    res.json({
      status: "success",
      message: "Data fetched successfully",
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getByVehicle = async (req, res) => {
  const { type, code } = req.params;
  const { page = 1, limit = 10, search = "" } = req.query;

  try {
    const offset = (page - 1) * limit;
    const { count, rows } = await ProductMembership.findAndCountAll({
      where: {
        vehicle_type: type,
        location_code: code,
        // is_show: 1,
        [Op.or]: [{ product_name: { [Op.like]: `%${search}%` } }],
      },
      attributes: [
        "periode",
        "product_name",
        [Sequelize.fn("MAX", Sequelize.col("id")), "id"],
        [Sequelize.fn("MAX", Sequelize.col("product_code")), "product_code"],
        [Sequelize.fn("MAX", Sequelize.col("price")), "price"],
        [Sequelize.fn("MAX", Sequelize.col("Fee")), "Fee"],
        [
          Sequelize.fn("MAX", Sequelize.col("card_activation_fee")),
          "card_activation_fee",
        ],
      ],
      group: ["periode"],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[Sequelize.fn("MAX", Sequelize.col("id")), "ASC"]],
    });

    const total = await ProductMembership.count({
      distinct: true,
      col: "periode",
      where: {
        vehicle_type: type,
        location_code: code,
        [Op.or]: [{ product_name: { [Op.like]: `%${search}%` } }],
      },
    });

    res.json({
      status: "success",
      message: "Data fetched successfully",
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getByLocationByPeriode = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    periode = "",
    locationCode = "",
    type = "",
  } = req.query;

  const currentDate = moment().startOf("month");

  try {
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Membuat whereClause dinamis
    const whereClause = {
      location_code: locationCode || undefined,
      vehicle_type: type || undefined,
      // end_date: { [Op.gte]: currentDate.toDate() }, // Tetap dipakai
    };

    // Jika periode tidak kosong, tambahkan ke whereClause
    if (periode) {
      whereClause.periode = periode;
    }

    // Jika search tidak kosong, gunakan LIKE
    if (search) {
      whereClause.product_name = { [Op.like]: `%${search}%` };
    }

    // Eksekusi query dengan whereClause yang sudah diperbaiki
    const { count, rows } = await ProductMembership.findAndCountAll({
      where: whereClause,
      attributes: ["id", "product_name", "start_date", "end_date", "price"],
      limit: parseInt(limit, 10),
      offset: offset,
      order: [["created_at", "DESC"]],
      logging: console.log, // Debugging SQL
    });

    res.json({
      status: "success",
      message: "Data fetched successfully",
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      data: rows,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new Location Area
export const createProductMember = async (req, res) => {
  const { id, location_code, location_name, KID, Create_by, Update_by } =
    req.body;

  try {
    const newProductMember = await ProductMembership.create({
      id,
      location_code,
      location_name,
      KID,
      Create_by,
      Update_by,
    });
    res.status(201).json(newProductMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Location Area
export const updateProductMember = async (req, res) => {
  const { id } = req.params;
  const { location_code, location_name, KID, Create_by, Update_by } = req.body;

  try {
    const ProductMember = await ProductMembership.findByPk(id);
    if (!ProductMember) {
      return res.status(404).json({ message: "Location Area not found" });
    }

    await ProductMember.update({
      location_code,
      location_name,
      KID,
      Create_by,
      Update_by,
      updated_at: new Date(),
    });

    res.json(ProductMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Location Area
export const deleteProductMember = async (req, res) => {
  const { id } = req.params;

  try {
    const ProductMember = await ProductMembership.findByPk(id);
    if (!ProductMember) {
      return res.status(404).json({ message: "Location Area not found" });
    }

    await ProductMember.destroy();
    res.json({ message: "Location Area deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
