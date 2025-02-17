import { Op, Sequelize } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import moment from "moment/moment.js";
import ExcelJs from "exceljs";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import { errorResponse, successResponse } from "../../config/response.js";

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
            as: "trxHistoryUser",
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
          as: "trxHistoryUser",
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
          as: "trxHistoryUser",
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

export const exportHistoryTransaction = async (req, res) => {
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const date = req.query.date;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    const dateCondition = date
      ? {
          createdAt: {
            [Sequelize.Op.gte]: Sequelize.literal(`'${date} 00:00:00'`),
            [Sequelize.Op.lt]: Sequelize.literal(`'${date} 23:59:59'`),
          },
        }
      : null;

    const result = await TransactionHistoryPayment.findAndCountAll({
      where: {
        ...whereClause,
        ...(dateCondition ? dateCondition : {}),
      },
      include: [
        {
          model: User,
          as: "trxHistoryUser",
          attributes: ["fullname", "email"],
        },
      ],
    });

    if (result) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", width: 20, key: "createdAt" },
        { header: "Invoice No", width: 40, key: "invoice_id" },
        { header: "Name", width: 35, key: "fullname" },
        { header: "Email", width: 35, key: "email" },
        { header: "Virtual Account Number", width: 35, key: "virtual_account" },
        { header: "Transaction Code", width: 30, key: "trxId" },
        { header: "Product Name", width: 35, key: "product_name" },
        { header: "Product Type", width: 20, key: "purchase_type" },
        { header: "Payment Method", width: 30, key: "transactionType" },
        { header: "Amount", width: 30, key: "price" },
        { header: "Status", width: 20, key: "statusPayment" },
      ];

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      });

      for (const [index, value] of result.rows.entries()) {
        const row = worksheet.addRow({
          No: index + 1,
          createdAt: value.createdAt
            ? moment(value.createdAt)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          invoice_id: value.invoice_id || "-",
          fullname: value.trxHistoryUser ? value.trxHistoryUser?.fullname : "-",
          email: value.trxHistoryUser ? value.trxHistoryUser?.email : "-",
          virtual_account: value.virtual_account || "-",
          trxId: value.trxId || "-",
          product_name: value.product_name || "-",
          purchase_type: value.purchase_type || "-",
          purchase_type: value.transactionType || "-",

          price: value.price || "-",
          statusPayment: value.statusPayment || "-",
        });

        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Bold & warna putih
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0070C0" }, // Background biru
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName =
        locationCode.length > 0 && date
          ? `History_transaction_${date}.xlsx`
          : `History_transaction_alldate.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ success: false, message: "Get data failed" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const exportHistoryPayment = async (req, res) => {
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const date = req.query.date;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    const dateCondition = date
      ? {
          created_at: {
            [Sequelize.Op.gte]: Sequelize.literal(`'${date} 00:00:00'`),
            [Sequelize.Op.lt]: Sequelize.literal(`'${date} 23:59:59'`),
          },
        }
      : null;

    const result = await PaymentTransaction.findAndCountAll({
      where: {
        ...whereClause,
        ...(dateCondition ? dateCondition : {}),
      },
    });

    if (result) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", width: 20, key: "createdAt" },
        { header: "Ticket Number", width: 35, key: "no_tiket" },
        { header: "Product Name", width: 20, key: "product_name" },
        { header: "Location", width: 35, key: "location_name" },
        { header: "Transaction Code", width: 30, key: "trx_id" },
        { header: "Invoice Number", width: 30, key: "invoice_number" },
        {
          header: "Virtual Account Name",
          width: 35,
          key: "virtual_account_name",
        },
        {
          header: "Virtual Account Number",
          width: 35,
          key: "virtual_account_number",
        },
        {
          header: "Virtual Account Email",
          width: 35,
          key: "virtual_account_email",
        },
        { header: "Payment Method", width: 30, key: "payment_using" },
        { header: "Product", width: 35, key: "app_module" },
        { header: "RRN", width: 20, key: "RRN" },
        { header: "Amount", width: 30, key: "paid_amount" },
        { header: "Status", width: 20, key: "status_transaction" },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // Bold & warna putih
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "0070C0" }, // Background biru
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      for (const [index, value] of result.rows.entries()) {
        const row = worksheet.addRow({
          No: index + 1,
          createdAt: value.created_at
            ? moment(value.created_at)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          no_tiket: value.no_tiket || "-",
          product_name: value.product_name || "-",
          location_name: value.location_name || "-",
          trx_id: value.trx_id || "-",
          invoice_number: value.invoice_number || "-",
          virtual_account_name: value.virtual_account_name || "-",
          virtual_account_number: value.virtual_account_number || "-",
          virtual_account_email: value.virtual_account_email || "-",
          payment_using: value.payment_using || "-",
          app_module: value.app_module || "-",
          RRN: value.RRN || "-",
          purchase_type: value.transactionType || "-",
          paid_amount: value.paid_amount || "-",
          status_transaction: value.status_transaction || "-",
        });

        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName =
        locationCode.length > 0 && date
          ? `History_Payment_${date}.xlsx`
          : `History_Payment_alldate.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ success: false, message: "Get data failed" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const historyUsersById = async (req, res) => {
  try {
    const id = req.params.id;
    const { limit = 10, page = 1, search = "" } = req.query;

    if (!id) {
      return errorResponse(res, 400, "Missing id parameter");
    }

    const users = await User.findOne({
      where: { id: id },
      attributes: ["id", "fullname", "email"],
    });

    const transactions = await TransactionHistoryPayment.findAll({
      where: { user_id: id },
      order: [["timestamp", "DESC"]],
    });

    const checkins = await HistoryPost.findAll({
      where: { user_id: id },
      order: [["gate_in_time", "DESC"]],
    });

    let currentPoint = 0;
    let history = [];

    transactions.forEach((trx) => {
      if (trx.purchase_type === "TOPUP") {
        currentPoint += parseInt(trx.price);
        history.push({
          date: trx.timestamp,
          description: "Topup Point",
          debet: "",
          kredit: trx.price,
          currentPoint: currentPoint,
        });
      } else if (
        trx.purchase_type === "MEMBERSHIP" &&
        trx.transactionType === "POINT"
      ) {
        currentPoint -= parseInt(trx.price);
        history.push({
          date: trx.timestamp,
          description: `Pembelian ${trx.product_name}`,
          debet: trx.price,
          kredit: "",
          currentPoint: currentPoint,
        });
      }
    });

    checkins.forEach((checkin) => {
      currentPoint -= parseInt(checkin.tariff);
      history.push({
        date: checkin.gate_in_time,
        description: `Parking ${checkin.status_member} di ${checkin.location_name}`,
        debet: checkin.tariff,
        kredit: "",
        currentPoint: currentPoint,
      });
    });

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter berdasarkan search query jika ada
    if (search) {
      history = history.filter((item) =>
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Implementasi pagination
    const totalRecords = history.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedHistory = history.slice((page - 1) * limit, page * limit);

    const response = {
      users,
      history: paginatedHistory,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    };

    return successResponse(res, 200, "Success", response);
  } catch (e) {
    return errorResponse(res, 500, e.message);
  }
};

export const historyTransactionByLocation = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Gunakan bulan & tahun saat ini jika tidak diberikan
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    // Ambil transaksi dengan filter yang diberikan
    const transactions = await TransactionHistoryPayment.findAll({
      attributes: [
        "location_code",
        "location_name",
        "vehicle_type",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalTransactions"],
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalAmount"],
      ],
      where: {
        transactionType: {
          [Op.not]: "TOPUP", // Tidak termasuk transaksi TOPUP
        },
        purchase_type: "MEMBERSHIP", // Hanya membership
        statusPayment: "PAID", // Hanya transaksi yang sudah dibayar
        createdAt: {
          [Op.between]: [
            new Date(selectedYear, selectedMonth - 1, 1),
            new Date(selectedYear, selectedMonth, 0, 23, 59, 59),
          ],
        },
      },
      group: ["location_name", "vehicle_type"],
      raw: true,
    });

    // Struktur data sesuai request
    const result = transactions.reduce((acc, trx) => {
      let existing = acc.find(
        (item) => item.location_name === trx.location_name
      );

      if (!existing) {
        existing = {
          location_code: trx.location_code,
          location_name: trx.location_name,
          totalMobil: 0,
          totalMotor: 0,
          totalAmountMobil: 0,
          totalAmountMotor: 0,
          totalAmount: 0,
        };
        acc.push(existing);
      }

      if (trx.vehicle_type === "MOBIL") {
        existing.totalMobil = parseInt(trx.totalTransactions);
        existing.totalAmountMobil = parseFloat(trx.totalAmount || 0);
      } else if (trx.vehicle_type === "MOTOR") {
        existing.totalMotor = parseInt(trx.totalTransactions);
        existing.totalAmountMotor = parseFloat(trx.totalAmount || 0);
      }

      existing.totalAmount =
        existing.totalAmountMobil + existing.totalAmountMotor;

      return acc;
    }, []);

    res.json({ success: true, message: "Get data successfully", data: result });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
