import { Sequelize } from "sequelize";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";

export const HistoryPostController = async (req, res) => {
  const id = req.userId;
  const limit = parseInt(req.query.limit) || 10; // Default 10 item per halaman
  const page = parseInt(req.query.page) || 1; // Default halaman pertama
  const offset = (page - 1) * limit;
  console.log(id);
  try {
    // const history = await HistoryPost.findAll({
    //   where: { user_id: id },
    // });

    const { count, rows: transactions } = await HistoryPost.findAndCountAll({
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
        "status_member",
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]], // Urutkan dari yang terbaru
    });
    console.log(transactions);

    if (!transactions) {
      return { message: "History not found" };
    }

    // Tetap kembalikan status 200 meskipun tidak ada transaksi
    res.status(200).json({
      statusCode: 200,
      message: "Transaction retrieved successfully",
      data: transactions,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(400).json({
      statusCode: 400,
      message: error.message,
    });
  }
};
