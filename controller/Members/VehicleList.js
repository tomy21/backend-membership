<<<<<<< HEAD
import { Op } from "sequelize";
=======
import { Op, Sequelize } from "sequelize";
>>>>>>> production_v2
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

<<<<<<< HEAD
export const getVehiclesByType = async (req, res) => {
=======
export const getVehiclesByUserIdUnActive = async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10, search = "", locationCode, type } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Ambil semua kendaraan milik user
    const userVehicles = await VehicleList.findAll({
      where: {
        cust_id: userId,
        plate_number: { [Op.like]: `%${search}%` }, // Filter search
      },
      attributes: ["id", "plate_number"], // Ambil ID dan plate_number
    });

    // Ekstrak ID kendaraan (Cust_Member) dari VehicleList
    const vehicleIds = userVehicles.map((v) => v.id);

    if (vehicleIds.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No vehicles found for the user.",
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
      });
    }

    // Ambil ID kendaraan yang sudah terdaftar di MembershipDetail untuk lokasi tertentu
    const registeredVehicleIds = await MembershipDetail.findAll({
      where: {
        Cust_Member: { [Op.in]: vehicleIds },
        location_id: locationCode,
      },
      attributes: ["Cust_Member"], // Ambil hanya Cust_Member
    });

    // Ekstrak Cust_Member yang sudah terdaftar
    const registeredIds = registeredVehicleIds.map((r) => r.Cust_Member);

    // Filter kendaraan yang belum terdaftar di lokasi tertentu
    const { count, rows } = await VehicleList.findAndCountAll({
      where: {
        cust_id: userId,
        vehicle_type: type,
        id: { [Op.in]: vehicleIds }, // Hanya kendaraan milik user
        id: { [Op.notIn]: registeredIds }, // Kecualikan kendaraan yang sudah terdaftar
      },
      attributes: ["id", "plate_number"], // Ambil ID dan plate_number
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      message: "Data fetched successfully",
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getVehiclesByType = async (req, res) => {
  const userId = req.userId;
>>>>>>> production_v2
  const { type } = req.params;
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await VehicleList.findAndCountAll({
      where: {
<<<<<<< HEAD
=======
        cust_id: userId,
>>>>>>> production_v2
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
    res.status(500).json({ message: error.message });
  }
};

// Update a vehicle
<<<<<<< HEAD
=======
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

>>>>>>> production_v2
export const updateVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await VehicleList.findByPk(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await vehicle.update(req.body);
<<<<<<< HEAD
    res.json(vehicle);
=======
    res
      .status(200)
      .json({ status: true, message: "Vehicle updated successfully", vehicle });
>>>>>>> production_v2
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
