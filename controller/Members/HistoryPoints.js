import { Op } from "sequelize";
import User from "../../model/Members/Users.js";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";

export const historyPoint = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const { count, rows } = await User.findAndCountAll({
      where: {
        points: { [Op.gt]: 0 },
        [Op.or]: [
          { fullname: { [Op.like]: `%${search}%` } },
          { customer_no: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        "id",
        "fullname",
        "customer_no",
        "email",
        "phone_number",
        "points",
        "is_active",
      ],
      order: [["created_at", "DESC"]],
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
    res.status(400).json({ error: error.message });
  }
};

export const userParkingByPoint = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const idUser = req.params.id;

    const { count, rows } = await HistoryPost.findAndCountAll({
      where: {
        user_id: idUser,
        status_member: "NON-MEMBER",
        [Op.or]: [
          { location_name: { [Op.like]: `%${search}%` } },
          { plate_number: { [Op.like]: `%${search}%` } },
        ],
      },
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
    res.status(400).json({ error: error.message });
  }
};

export const HistoryTransaction = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const idUser = req.params.id;

    const { count, rows } = await TransactionHistoryPayment.findAndCountAll({
      where: {
        user_id: idUser,
        [Op.and]: [
          {
            [Op.or]: [
              { purchase_type: "TOPUP" },
              {
                purchase_type: "MEMBERSHIP",
                transactionType: "POINT",
              },
              //   { statusPayment: "PAID" },
            ],
          },
          {
            [Op.or]: [
              { location_name: { [Op.like]: `%${search}%` } },
              { trxId: { [Op.like]: `%${search}%` } },
              { invoice_id: { [Op.like]: `%${search}%` } },
            ],
          },
        ],
      },
      attributes: [
        "Id",
        "trxId",
        "location_name",
        "location_code",
        "periode",
        "price",
        "product_name",
        "purchase_type",
        "rfid",
        "statusPayment",
        "vehicle_type",
        "user_id",
        "timestamp",
        "transactionType",
        "createdAt",
      ],
      order: [["createdAt", "ASC"]], // 🔑 penting
    });

    // 🔥 HITUNG SALDO BERJALAN
    let saldo = 0;

    const mappedData = rows.map((row) => {
      const price = Number(row.price || 0);

      let debit = 0;
      let credit = 0;
      let mutationType = null;

      if (row.statusPayment === "PAID") {
        if (row.purchase_type === "TOPUP") {
          credit = price;
          mutationType = "CREDIT";
          saldo += credit;
        } else if (
          row.purchase_type === "MEMBERSHIP" &&
          row.transactionType === "POINT"
        ) {
          debit = price;
          mutationType = "DEBIT";
          saldo -= debit;
        }
      }

      return {
        ...row.toJSON(),
        debit,
        credit,
        mutationType,
        saldo, // 🔥 INI YANG DIMINTA
      };
    });

    // pagination setelah saldo dihitung
    const paginatedData = mappedData.slice(offset, offset + limit);

    res.status(200).json({
      status: "success",
      message: "History fetched successfully",
      total: mappedData.length,
      totalPages: Math.ceil(mappedData.length / limit),
      currentPage: page,
      data: paginatedData,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
