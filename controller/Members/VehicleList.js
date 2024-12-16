import { Op } from "sequelize";
import VehicleList from "../../model/Members/v02/VehicleList.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";

export const getVehicles = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await VehicleList.findAndCountAll({
      where: {
        [Op.or]: [
          { vehicle_type: { [Op.like]: `%${search}%` } },
          { plate_number: { [Op.like]: `%${search}%` } },
          { member_customer_no: { [Op.like]: `%${search}%` } },
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      data: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehiclesByUSerId = async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await VehicleList.findAndCountAll({
      where: {
        cust_id: userId,
        [Op.or]: [
          { vehicle_type: { [Op.like]: `%${search}%` } },
          { plate_number: { [Op.like]: `%${search}%` } },
          { member_customer_no: { [Op.like]: `%${search}%` } },
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      raw: false,
      nest: true,
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

export const getVehiclesByType = async (req, res) => {
  const userId = req.userId;
  const { type } = req.params;
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await VehicleList.findAndCountAll({
      where: {
        cust_id: userId,
        vehicle_type: type,
        [Op.or]: [
          { vehicle_type: { [Op.like]: `%${search}%` } },
          { plate_number: { [Op.like]: `%${search}%` } },
          { member_customer_no: { [Op.like]: `%${search}%` } },
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
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

// Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const vehicle = await VehicleList.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a vehicle
export const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await VehicleList.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await VehicleList.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await vehicle.update(req.body);
    res
      .status(200)
      .json({ status: true, message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await VehicleList.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await vehicle.destroy();
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
