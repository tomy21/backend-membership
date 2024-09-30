import MemberHistoryPost from "../../model/Members/MemberHistoryPost.js";
import { Op } from "sequelize";

// Get All with Pagination and Search
export const getAllMemberPoints = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const memberPoints = await MemberHistoryPost.findAndCountAll({
      where: {
        [Op.or]: [
          { CardId: { [Op.like]: `%${search}%` } }, // Search by CardId
          { LocationId: { [Op.like]: `%${search}%` } }, // Search by LocationId
        ],
      },
      limit: parseInt(limit),
      offset: offset,
    });

    res.status(200).json({
      totalItems: memberPoints.count,
      totalPages: Math.ceil(memberPoints.count / limit),
      currentPage: parseInt(page),
      data: memberPoints.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};

// Get Member Point by ID
export const getMemberPointById = async (req, res) => {
  const memberId = req.userId;
  const { page = 1, limit = 10, search = "" } = req.query;

  const offset = (page - 1) * limit;
  const whereCondition = {
    MemberUserId: memberId,
    ...(search && {
      [Op.or]: [
        { description: { [Op.like]: `%${search}%` } },
        { anotherField: { [Op.like]: `%${search}%` } },
      ],
    }),
  };

  try {
    const { count, rows } = await MemberHistoryPost.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No Member Points found for the given CardId",
      });
    }

    res.json({
      statusCode: 200,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching member points:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Error fetching data",
      error: error.message, // Berikan pesan error ke klien tanpa log detail error di console
    });
  }
};

// Get Member Points by CardId
export const getMemberPointsByCardId = async (req, res) => {
  const { cardId } = req.params;
  const { page = 1, limit = 10, searchQuery = "" } = req.query;

  const offset = (page - 1) * limit;

  try {
    const where = {
      MemberUserId: cardId,
      ...(searchQuery && {
        [Op.or]: [{ description: { [Op.like]: `%${searchQuery}%` } }],
      }),
    };

    const { count, rows } = await MemberHistoryPost.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No Member Points found for the given CardId",
      });
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};
