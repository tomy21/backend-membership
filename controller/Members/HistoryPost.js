import { Op, Sequelize } from "sequelize";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import User from "../../model/Members/Users.js";

export const HistoryPostController = async (req, res) => {
  const id = req.userId;
  const limit = parseInt(req.query.limit) || 10; // Default 10 item per halaman
  const page = parseInt(req.query.page) || 1; // Default halaman pertama
  const offset = (page - 1) * limit;

  try {
    const { count, rows: histories } = await HistoryPost.findAndCountAll({
      where: { user_id: id },
      attributes: [
        [
          Sequelize.literal(`
            CASE 
            WHEN check_in_time IS NOT NULL AND gate_out_time IS NULL THEN 'In area parking'
            WHEN check_in_time IS NOT NULL AND gate_out_time IS NOT NULL THEN 'Out area parking'
            ELSE 'Unknown'
            END
          `),
          "status",
        ],
        "plate_number",
        "location_name",
        "gate_in_time",
        "gate_out_time",
        "tariff",
        "status_member",
        "balance_before",
        "balance_after",
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    if (!histories) {
      return res.status(500).json({
        statusCode: 500,
        message: "No history found",
      });
    }

    // Transformasi data untuk membuat dua baris per entri
    const transformedHistories = histories.flatMap((history) => [
      {
        plate_number: history.plate_number,
        location_name: history.location_name,
        time: history.gate_out_time,
        type: "Keluar Area Parkir",
        status_member: history.status_member,
        balance: history.balance_after,
        tariff:
          parseInt(history.balance_before) - parseInt(history.balance_after),
      },
      {
        plate_number: history.plate_number,
        location_name: history.location_name,
        time: history.gate_in_time,
        type: "Masuk Area Parkir",
        status_member: history.status_member,
        balance: history.balance_before,
      },
    ]);

    // Paginasi data hasil transformasi
    const paginatedData = transformedHistories.slice(offset, offset + limit);

    res.status(200).json({
      statusCode: 200,
      message: "Transaction retrieved successfully",
      data: paginatedData,
      totalItems: transformedHistories.length,
      currentPage: page,
      totalPages: Math.ceil(transformedHistories.length / limit),
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};

export const AllTransaction = async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const offset = (page - 1) * limit;
  const status = req.query.status?.trim() || "All";
  const statusMember = req.query.statusMember?.trim() || null;
  const isStatusDefined = status !== undefined && status !== null;
  try {
    const whereCondition = {}; // Inisialisasi objek where

    // Jika status bukan string kosong, tambahkan filter is_close
    if (isStatusDefined && status !== "All") {
      whereCondition.is_close = status;
      whereCondition.gate_in_time = { [Op.ne]: null };
    }

    if (statusMember === "NON-MEMBER") {
      whereCondition.status_member = statusMember;
      whereCondition.is_close = 1;
    }

    const { count, rows } = await HistoryPost.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "userHistoryPost",
          attributes: ["fullname", "email"],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      total: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};

export const transactionsCasual = async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const offset = (page - 1) * limit;

  // Ambil bulan dari query, default ke bulan sekarang jika tidak diberikan
  const selectedMonth = req.query.month
    ? parseInt(req.query.month) // Jika diberikan, gunakan query
    : new Date().getMonth() + 1; // Default ke bulan sekarang (getMonth() mulai dari 0)

  try {
    // Filter transaksi berdasarkan bulan
    const whereCondition = {
      status_member: "NON-MEMBER",
      is_close: 1,
      createdAt: {
        [Op.between]: [
          new Date(new Date().getFullYear(), selectedMonth - 1, 1), // Awal bulan
          new Date(new Date().getFullYear(), selectedMonth, 0, 23, 59, 59), // Akhir bulan
        ],
      },
    };

    // Ambil data transaksi
    const { count, rows } = await HistoryPost.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "userHistoryPost",
          attributes: ["fullname", "email"],
        },
      ],
    });

    // Hitung total jumlah tariff untuk bulan yang dipilih
    const totalTariff = await HistoryPost.sum("tariff", {
      where: whereCondition,
    });

    // Ambil daftar unik bulan yang tersedia di database
    const monthsAvailable = await HistoryPost.findAll({
      attributes: [
        [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "month"],
      ],
      group: ["month"],
      order: [[Sequelize.fn("MONTH", Sequelize.col("createdAt")), "ASC"]],
      raw: true,
    });

    // Ubah hasil menjadi array angka bulan
    const availableMonths = monthsAvailable.map((m) => m.month);

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      total: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      totalTariff: totalTariff || 0, // Default ke 0 jika tidak ada transaksi
      availableMonths: availableMonths, // List bulan untuk dropdown
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};
