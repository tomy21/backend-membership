import MemberHistoryTransaction from "../../model/Members/MemberHistoryTransaction.js";

// Create a new MemberHistoryTransaction
export const createMemberHistoryTransaction = async (req, res) => {
  try {
    const newTransaction = await MemberHistoryTransaction.create(req.body);
    res.status(201).json({
      statusCode: 201,
      message: "MemberHistoryTransaction created successfully",
      data: newTransaction,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

// Get all MemberHistoryTransactions
export const getAllMemberHistoryTransactions = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        statusCode: 400,
        message: "Page and limit must be greater than 0.",
      });
    }
    const offset = (page - 1) * limit;

    const { count: totalTransactions, rows: transactions } =
      await MemberHistoryTransaction.findAndCountAll({
        limit,
        offset,
      });

    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
      statusCode: 200,
      message: "MemberHistoryTransactions retrieved successfully",
      pagination: {
        currentPage: page,
        totalPages,
        totalTransactions,
        limit,
      },
      data: transactions,
    });
  } catch (error) {
    res.status(400).json({
      statusCode: 400,
      message: error.message,
    });
  }
};

// Get a single MemberHistoryTransaction by ID
export const getMemberHistoryTransaction = async (req, res) => {
  try {
    const id = req.userId;
    const transactions = await MemberHistoryTransaction.findAll({
      where: { memberId: id }, // Mengasumsikan memberId sebagai foreign key
      order: [["createdAt", "DESC"]], // Mengurutkan berdasarkan createdAt descending
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberHistoryTransaction not found",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "MemberHistoryTransaction retrieved successfully",
      data: transactions,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getHistoryByUserId = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1; // Default ke halaman pertama
    const limit = parseInt(req.query.limit) || 10; // Default limit 10 item per halaman

    if (!userId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing userId query parameter",
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await MemberHistoryTransaction.findAndCountAll({
      where: {
        IdUsers: userId,
      },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberUserProduct not found",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "MemberUserProducts retrieved successfully",
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: rows,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};
