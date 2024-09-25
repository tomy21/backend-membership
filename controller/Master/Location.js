import { Sequelize } from "sequelize";
import { Location } from "../../model/Master/RefLocation.js";
import { UsersLocations } from "../../model/Master/UsersLocation.js";
import MemberProduct from "../../model/Members/ProductMember.js";

export const getLocationAll = async (req, res) => {
  try {
    const getLocation = await Location.findAll({
      attributes: ["Id", "Code", "Name"],
    });
    res.json(getLocation);
  } catch (error) {
    console.log(error);
  }
};

export const getLocationActiveMember = async (req, res) => {
  try {
    const getLocation = await Location.findAll({
      where: { IsMember: 1 },
      attributes: ["Id", "Code", "Name", "LocationCode"],
    });
    res.json(getLocation);
  } catch (error) {
    console.log(error);
  }
};

export const getLocationAllLocation = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || "";
    const offset = (page - 1) * limit;

    const whereCondition = {
      IsMember: 1,
      ...(searchQuery && {
        [Op.or]: [
          { Name: { [Op.like]: `%${searchQuery}%` } },
          { Address: { [Op.like]: `%${searchQuery}%` } },
        ],
      }),
    };

    const getLocation = await Location.findAndCountAll({
      attributes: ["Id", "Code", "Name", "Address"],
      where: whereCondition,
      limit: limit,
      offset: offset,
      include: [
        {
          model: MemberProduct,
          as: "Products", // Alias yang sesuai
          attributes: [],
          where: { IsActive: 1 }, // Hanya mengambil data yang aktif
          required: false, // Left join agar location tetap muncul meskipun tidak ada memberProduct
        },
      ],
      attributes: {
        include: [
          // Agregasi untuk VehicleType 'motor'
          [
            Sequelize.literal(`(
              SELECT SUM(\`MaxQuote\`)
              FROM \`MemberProducts\`
              WHERE \`MemberProducts\`.\`LocationCode\` = \`RefLocation\`.\`Code\`
              AND \`MemberProducts\`.\`IsActive\` = 1
              AND \`MemberProducts\`.\`VehicleType\` = 'motor'
            )`),
            "totalQuotaMotor",
          ],
          // Agregasi untuk VehicleType 'mobil'
          [
            Sequelize.literal(`(
              SELECT SUM(\`MaxQuote\`)
              FROM \`MemberProducts\`
              WHERE \`MemberProducts\`.\`LocationCode\` = \`RefLocation\`.\`Code\`
              AND \`MemberProducts\`.\`IsActive\` = 1
              AND \`MemberProducts\`.\`VehicleType\` = 'mobil'
            )`),
            "totalQuotaMobil",
          ],
        ],
      },
      group: ["RefLocation.Id"], // Kelompokkan berdasarkan Location
    });

    res.json({
      success: true,
      total: getLocation.count,
      page: page,
      pages: Math.ceil(getLocation.count / limit),
      data: getLocation.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLocationUsers = async (req, res) => {
  const userId = req.query.userId;

  try {
    const userLocations = await UsersLocations.findAll({
      where: { UserId: userId },
      include: [
        {
          model: Location,
          attributes: ["Id", "Code", "Name"],
        },
      ],
    });

    const locations = userLocations.map(
      (userLocation) => userLocation.RefLocation
    );

    res.json(locations);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
