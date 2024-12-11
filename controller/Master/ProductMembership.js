import { Op } from "sequelize";
import ProductMembership from "../../model/Members/v02/ProductMembership.js";

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
