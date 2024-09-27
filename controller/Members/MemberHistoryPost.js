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
  const id = req.userId;
  const { page = 1, limit = 10, search = "" } = req.userId; // default page 1, limit 10, dan search kosong

  const offset = (page - 1) * limit;

  try {
    // Menambahkan search filter di bagian where clause
    const whereCondition = {
      MemberUserId: id,
      // Jika ada search term, tambahkan kondisi pencarian
      ...(search && {
        [Op.or]: [
          { description: { [Op.like]: `%${search}%` } }, // contoh search berdasarkan 'description'
          { anotherField: { [Op.like]: `%${search}%` } }, // tambahkan field lain jika diperlukan
        ],
      }),
    };

    const { count, rows } = await MemberHistoryPost.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit), // jumlah data per page
      offset: parseInt(offset), // mulai dari data ke-offset
    });

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No Member Points found for the given CardId" });
    }

    res.status(200).json({
      totalItems: count, // total data yang ditemukan
      totalPages: Math.ceil(count / limit), // total halaman
      currentPage: parseInt(page), // halaman saat ini
      data: rows, // data untuk halaman saat ini
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};

// Get Member Points by CardId
export const getMemberPointByCardId = async (req, res) => {
  const { memberUserId } = req.params;
  const { page = 1, limit = 10, search = "" } = req.query; // default page 1, limit 10, dan search kosong

  const offset = (page - 1) * limit;

  try {
    // Menambahkan search filter di bagian where clause
    const whereCondition = {
      MemberUserId: memberUserId,
      // Jika ada search term, tambahkan kondisi pencarian
      ...(search && {
        [Op.or]: [
          { description: { [Op.like]: `%${search}%` } }, // contoh search berdasarkan 'description'
          { anotherField: { [Op.like]: `%${search}%` } }, // tambahkan field lain jika diperlukan
        ],
      }),
    };

    const { count, rows } = await MemberHistoryPost.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit), // jumlah data per page
      offset: parseInt(offset), // mulai dari data ke-offset
    });

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No Member Points found for the given CardId" });
    }

    res.status(200).json({
      totalItems: count, // total data yang ditemukan
      totalPages: Math.ceil(count / limit), // total halaman
      currentPage: parseInt(page), // halaman saat ini
      data: rows, // data untuk halaman saat ini
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};
