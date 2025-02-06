import { Op } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";

export const createTransaction = async (req, res) => {
  try {
    const transaction = await TransactionHistoryPayment.create(req.body);
    res.status(201).json({
      statusCode: 201,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getTransactionByUserId = async (req, res) => {
  try {
    const id = req.userId;

    // Ambil query limit dan page dari request, gunakan default jika tidak ada
    const limit = parseInt(req.query.limit) || 10; // Default 10 item per halaman
    const page = parseInt(req.query.page) || 1; // Default halaman pertama
    const offset = (page - 1) * limit;

    const { count, rows: transactions } =
      await TransactionHistoryPayment.findAndCountAll({
        where: { user_id: id },
        include: [
          {
            model: User,
            attributes: ["fullname", "email"],
          },
        ],
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]], // Urutkan dari yang terbaru
      });

    // Tetap kembalikan status 200 meskipun tidak ada transaksi
    res.status(200).json({
      statusCode: 200,
      message: transactions.length
        ? "Transaction retrieved successfully"
        : "No transactions found",
      data: transactions, // Akan menjadi array kosong jika tidak ada data
      pagination: {
        totalItems: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getTrxStatusPaymentByVA = async (req, res) => {
  try {
    const noVA = req.params.noVa;
    console.log(noVA);
    const transaction = await PaymentTransaction.findOne({
      where: { virtual_account_number: noVA },
      // include: [
      //   {
      //     model: User,
      //     attributes: ["fullname", "email"],
      //   },
      // ],
      order: [["created_at", "DESC"]], // Urutkan dari yang terbaru
    });

    if (!transaction) {
      return res.status(404).json({
        statusCode: 404,
        message: "Transaction not found",
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getTrxStatusPayment = async (req, res) => {
  try {
    const trxId = req.query.trxId;

    const transaction = await TransactionHistoryPayment.findOne({
      where: { trxId: trxId },
      include: [
        {
          model: User,
          attributes: ["fullname", "email"],
        },
      ],
      order: [["createdAt", "DESC"]], // Urutkan dari yang terbaru
    });

    if (!transaction) {
      return res.status(404).json({
        statusCode: 404,
        message: "Transaction not found",
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await TransactionHistoryPayment.update(req.body, {
      where: { id },
    });

    if (!updated) {
      return res.status(404).json({
        statusCode: 404,
        message: "Transaction not found",
      });
    }

    const updatedTransaction = await TransactionHistoryPayment.findOne({
      where: { id },
    });
    res.status(200).json({
      statusCode: 200,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TransactionHistoryPayment.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Transaction deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      ...(status && { statusPayment: status }), // Hanya tambahkan jika status ada
      ...(search && {
        [Op.or]: [
          { trxId: { [Op.like]: `%${search}%` } },
          { virtual_account: { [Op.like]: `%${search}%` } },
          { product_name: { [Op.like]: `%${search}%` } },
        ],
      }),
    };

    const { count, rows } = await TransactionHistoryPayment.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include: [
        {
          model: User,
          attributes: ["fullname", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      statusCode: 200,
      message: "Transactions retrieved successfully",
      pagination: {
        total: count,
        page: parseInt(page, 10),
        totalPages: Math.ceil(count / limit),
      },
      data: rows,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getPaymentByTrxId = async (req, res) => {
  try {
    const { trxId } = req.params;
    const transaction = await TransactionHistoryPayment.findOne({
      where: { trxId },
      include: [
        {
          model: User,
          attributes: ["fullname", "email"],
        },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        statusCode: 404,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getDetailPayment = async (req, res) => {};

//history payment
export const getPayment = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      ...(status && { status_transaction: status }),
      ...(search && {
        [Op.or]: [
          { trx_id: { [Op.like]: `%${search}%` } },
          { invoice_number: { [Op.like]: `%${search}%` } },
          { virtual_account_number: { [Op.like]: `%${search}%` } },
        ],
      }),
    };

    const { count, rows } = await PaymentTransaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      statusCode: 200,
      message: "Transactions retrieved successfully",
      pagination: {
        total: count,
        page: parseInt(page, 10),
        totalPages: Math.ceil(count / limit),
      },
      data: rows,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};
