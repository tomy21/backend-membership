import { Sequelize } from "sequelize";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";

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
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    if (!histories.length) {
      return res.status(404).json({
        statusCode: 404,
        message: "No history found",
      });
    }

    // Transformasi data untuk membuat dua baris per entri
    const transformedHistories = histories.flatMap((history) => [
      {
        plate_number: history.plate_number,
        location_name: history.location_name,
        time: history.gate_in_time,
        type: "Masuk Area Parkir",
        status_member: history.status_member,
        tariff: history.tariff,
      },
      {
        plate_number: history.plate_number,
        location_name: history.location_name,
        time: history.gate_out_time,
        type: "Keluar Area Parkir",
        status_member: history.status_member,
        tariff: history.tariff,
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
