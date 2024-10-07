import { LocationMembers } from "../../model/Master/RefLocationMembers.js";
import { Location } from "../../model/Master/RefLocation.js";
import { Op } from "sequelize";

// Create a new LocationMember
export const createLocationMember = async (req, res) => {
  try {
    const { LocationId, LocationCode, LocationName, IsMember, CreatedBy } =
      req.body;
    const newLocationMember = await LocationMembers.create({
      LocationId,
      LocationCode,
      LocationName,
      IsMember,
      CreatedBy,
    });
    res.status(201).json({
      statusCode: 200,
      message: "Create New Location Members successfully",
      data: newLocationMember,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create Location Member",
      error: error.message,
    });
  }
};

// Get all LocationMembers
export const getLocationMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit; // Hitung offset berdasarkan page dan limit

    // Gunakan query search
    const locationMembers = await LocationMembers.findAndCountAll({
      where: {
        LocationName: {
          [Op.like]: `%${search}%`, // Gunakan LIKE untuk pencarian
        },
      },
      include: [{ model: Location, as: "MemberLocation" }],
      limit: parseInt(limit), // Batasi jumlah hasil
      offset: parseInt(offset), // Tentukan offset untuk pagination
    });

    res.status(200).json({
      statusCode: 200,
      message: "Location Members retrieved successfully",
      totalItems: locationMembers.count, // Total item tanpa pagination
      totalPages: Math.ceil(locationMembers.count / limit), // Total halaman
      currentPage: parseInt(page), // Halaman saat ini
      data: locationMembers.rows, // Data yang diambil sesuai paginasi
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch Location Members",
      error: error.message,
    });
  }
};

// Get a single LocationMember by Id
export const getLocationMemberById = async (req, res) => {
  try {
    const locationMember = await LocationMembers.findByPk(req.params.id, {
      include: [{ model: Location, as: "MemberLocation" }],
    });
    if (!locationMember) {
      return res.status(404).json({ message: "Location Member not found" });
    }
    res.status(201).json({
      statusCode: 200,
      message: "Location Members retrieved successfully",
      data: locationMember,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch Location Member",
      error: error.message,
    });
  }
};

// Update a LocationMember
export const updateLocationMember = async (req, res) => {
  try {
    const { LocationId, LocationCode, LocationName, IsMember, UpdatedBy } =
      req.body;
    const locationMember = await LocationMembers.findByPk(req.params.id);
    if (!locationMember) {
      return res.status(404).json({ message: "Location Member not found" });
    }

    locationMember.LocationId = LocationId;
    locationMember.LocationCode = LocationCode;
    locationMember.LocationName = LocationName;
    locationMember.IsMember = IsMember;
    locationMember.UpdatedBy = UpdatedBy;
    locationMember.UpdatedOn = new Date();

    await locationMember.save();
    res.status(201).json({
      statusCode: 200,
      message: "Location Members Updated successfully",
      data: locationMember,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update Location Member",
      error: error.message,
    });
  }
};

// Delete a LocationMember
export const deleteLocationMember = async (req, res) => {
  try {
    const locationMember = await LocationMembers.findByPk(req.params.id);
    if (!locationMember) {
      return res.status(404).json({ message: "Location Member not found" });
    }

    await locationMember.destroy();
    res.status(200).json({ message: "Location Member deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete Location Member",
      error: error.message,
    });
  }
};
