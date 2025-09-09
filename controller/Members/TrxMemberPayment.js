import { col, fn, literal, Op, Sequelize } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import moment from "moment/moment.js";
import ExcelJs from "exceljs";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import { errorResponse, successResponse } from "../../config/response.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";

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
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const { count, rows: transactions } =
      await TransactionHistoryPayment.findAndCountAll({
        where: {
          user_id: id,
          ...(search && {
            [Op.or]: [
              { trxId: { [Op.like]: `%${search}%` } },
              { virtual_account: { [Op.like]: `%${search}%` } },
              { product_name: { [Op.like]: `%${search}%` } },
            ],
          }),
        },
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
    res.status(401).json({
      statusCode: 401,
      message: err.message,
    });
  }
};

export const getTrxStatusPaymentByTrxid = async (req, res) => {
  try {
    const idTrx = req.params.idTrx;

    const paymentTrx = await PaymentTransaction.findOne({
      where: { trx_id: idTrx },
      order: [["created_at", "DESC"]],
    });

    if (paymentTrx) {
      return res.status(200).json({
        statusCode: 200,
        message: "Payment transaction retrieved successfully",
        data: paymentTrx,
      });
    }

    const transaction = await TransactionHistoryPayment.findOne({
      where: { trxId: idTrx },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Transaction history retrieved successfully",
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
    const { search, page = 1, limit = 10, status = "PAID" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      purchase_type: "MEMBERSHIP",
      ...(status && { statusPayment: status, purchase_type: "MEMBERSHIP" }),
      ...(search && {
        [Op.or]: [
          { trxId: { [Op.like]: `%${search}%` } },
          { virtual_account: { [Op.like]: `%${search}%` } },
          { product_name: { [Op.like]: `%${search}%` } },
          { location_name: { [Op.like]: `%${search}%` } },
          { vehicle_type: { [Op.like]: `%${search}%` } },
          { invoice_id: { [Op.like]: `%${search}%` } },
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
export const getDetailTransactionsTopup = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status, date } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      purchase_type: "TOPUP",
      ...(status && { statusPayment: status }),
      ...(search && {
        [Op.or]: [
          { trxId: { [Op.like]: `%${search}%` } },
          { virtual_account: { [Op.like]: `%${search}%` } },
          { product_name: { [Op.like]: `%${search}%` } },
        ],
      }),
      ...(date && {
        updatedAt: {
          [Op.gte]: new Date(`${date}T00:00:00.000Z`),
          [Op.lt]: new Date(`${date}T23:59:59.999Z`),
        },
      }),
    };

    const { count, rows } = await TransactionHistoryPayment.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include: [
        {
          model: User,
          attributes: ["fullname", "email", "points"],
          as: "trxHistoryUser",
        },
      ],
      order: [["updatedAt", "DESC"]],
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

export const getTransactionsTopup = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        statusCode: 400,
        message: "Parameter 'month' dan 'year' harus disediakan.",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // akhir bulan

    const dateFilter = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    // --- Ambil transaksi TOPUP ---
    const transaksiTopup = await TransactionHistoryPayment.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "tanggal"],
        [
          fn(
            "SUM",
            literal(
              `CASE WHEN statusPayment = 'PAID' THEN CAST(price AS UNSIGNED) ELSE 0 END`
            )
          ),
          "total_topup",
        ],
        [
          fn(
            "COUNT",
            literal(`CASE WHEN statusPayment = 'PAID' THEN 1 ELSE NULL END`)
          ),
          "jumlah_topup",
        ],
      ],
      where: {
        product_name: "TOP UP",
        ...dateFilter,
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // --- Ambil transaksi Membership (POINT) ---
    const transaksiMembership = await TransactionHistoryPayment.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "tanggal"],
        [fn("SUM", literal(`CAST(price AS UNSIGNED)`)), "membership"],
      ],
      where: {
        product_name: {
          [Op.ne]: "TOP UP",
        },
        transactionType: "POINT",
        ...dateFilter,
      },
      group: [fn("DATE", col("createdAt"))],
      raw: true,
    });

    // --- Ambil parkir casual ---
    const transaksiCasual = await HistoryPost.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "tanggal"],
        [fn("SUM", col("tariff")), "casual"],
      ],
      where: {
        status_member: "NON-MEMBER",
        ...dateFilter,
      },
      group: [fn("DATE", col("createdAt"))],
      raw: true,
    });

    // Gabungkan semua data berdasarkan tanggal
    const resultMap = {};

    transaksiTopup.forEach((trx) => {
      const tgl = trx.tanggal;
      resultMap[tgl] = {
        tanggal: tgl,
        paid: Number(trx.total_topup) || 0,
        total_topup: Number(trx.jumlah_topup) || 0,
        total_fee: Number(trx.jumlah_topup) * 5000,
        membership: 0,
        casual: 0,
      };
    });

    transaksiMembership.forEach((mem) => {
      const tgl = mem.tanggal;
      if (!resultMap[tgl])
        resultMap[tgl] = {
          tanggal: tgl,
          paid: 0,
          total_topup: 0,
          total_fee: 0,
          membership: 0,
          casual: 0,
        };
      resultMap[tgl].membership = Number(mem.membership) || 0;
    });

    transaksiCasual.forEach((cas) => {
      const tgl = cas.tanggal;
      if (!resultMap[tgl])
        resultMap[tgl] = {
          tanggal: tgl,
          paid: 0,
          total_topup: 0,
          total_fee: 0,
          membership: 0,
          casual: 0,
        };
      resultMap[tgl].casual = Number(cas.casual) || 0;
    });

    // Finalisasi hasil + hitung titipan
    const allData = Object.values(resultMap)
      .map((item) => {
        const total = item.paid;
        const titipan = total - (item.membership + item.casual);
        return {
          ...item,
          total,
          titipan: titipan < 0 ? 0 : titipan,
        };
      })
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    // Total keseluruhan (summary)
    const totalSummary = allData.reduce(
      (acc, curr) => {
        acc.total_topup += curr.total;
        acc.membership += curr.membership;
        acc.casual += curr.casual;
        acc.titipan += curr.titipan;
        return acc;
      },
      { total_topup: 0, membership: 0, casual: 0, titipan: 0 }
    );

    // Pagination
    const startIdx = (page - 1) * limit;
    const paginatedData = allData.slice(startIdx, startIdx + Number(limit));

    res.status(200).json({
      statusCode: 200,
      message: "Summary transaksi berhasil diambil",
      data: paginatedData,
      totalData: allData.length,
      currentPage: Number(page),
      totalPage: Math.ceil(allData.length / limit),
      summary: totalSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      statusCode: 500,
      message: "Gagal mengambil data summary transaksi",
      error: err.message,
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
      where: { ...whereClause, app_module: "APP_MEMBERSHIP" },
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

export const historyUsersById = async (req, res) => {
  try {
    const id = req.params.id;
    const { month, year, page = 1, limit = 10, search = "" } = req.query;

    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    if (!id) {
      return errorResponse(res, 400, "Missing id parameter");
    }

    const users = await User.findOne({
      where: { id: id },
      attributes: ["id", "fullname", "email"],
    });

    const transactions = await TransactionHistoryPayment.findAll({
      where: {
        user_id: id,
        createdAt: {
          [Op.between]: [
            new Date(selectedYear, selectedMonth - 1, 1),
            new Date(selectedYear, selectedMonth, 0, 23, 59, 59),
          ],
        },
      },
      order: [["createdAt", "ASC"]], // Urutkan dari yang paling lama
    });

    const checkins = await HistoryPost.findAll({
      where: { user_id: id },
      order: [["createdAt", "ASC"]], // Urutkan dari yang paling lama
    });

    let currentPoint = 0;
    let history = [];

    transactions.forEach((trx) => {
      if (trx.purchase_type === "TOPUP") {
        currentPoint += parseInt(trx.price);
        history.push({
          date: trx.createdAt,
          description: "Topup Point",
          debet: trx.price, // Tukar posisi debet jadi kredit
          kredit: "",
          currentPoint: currentPoint,
        });
      } else if (
        trx.purchase_type === "MEMBERSHIP" &&
        trx.transactionType === "POINT"
      ) {
        currentPoint -= parseInt(trx.price);
        history.push({
          date: trx.createdAt,
          description: `Pembelian membership ${trx.product_name} dengan Point`,
          debet: "",
          kredit: trx.price, // Tukar posisi kredit jadi debet
          currentPoint: currentPoint,
        });
      }
    });

    checkins.forEach((checkin) => {
      currentPoint -= parseInt(checkin.tariff);
      history.push({
        date: checkin.createdAt,
        description: `Parking ${checkin.status_member} di ${checkin.location_name}`,
        debet: "",
        kredit: checkin.tariff, // Tukar posisi kredit jadi debet
        currentPoint: currentPoint,
      });
    });

    // Data sudah urut dari yang paling lama, jadi tidak perlu sorting lagi

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
    const { month, year, page = 1, limit = 10, search = "" } = req.query;

    // Tanggal sekarang
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // 1–12
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    // Hitung startDate & endDate (periode 26 → 25)
    const startDate = new Date(selectedYear, selectedMonth - 2, 26, 0, 0, 0);
    const endDate = new Date(selectedYear, selectedMonth - 1, 25, 23, 59, 59);

    // Catatan:
    // - new Date(y, m, d) pakai 0-index untuk bulan.
    //   contoh: selectedMonth=9 (September), maka:
    //   startDate → (9-2=7 → Agustus) tanggal 26
    //   endDate   → (9-1=8 → September) tanggal 25

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await TransactionHistoryPayment.findAll({
      attributes: [
        "location_code",
        "location_name",
        "vehicle_type",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalTransactions"],
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalAmount"],
      ],
      where: {
        purchase_type: "MEMBERSHIP",
        statusPayment: "PAID",
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        location_name: {
          [Op.like]: `%${search}%`,
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

    const paginatedResult = result.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      message: "Get data successfully",
      data: paginatedResult,
      totalData: result.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(result.length / parseInt(limit)),
      period: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const transactionByLocation = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(selectedYear, selectedMonth - 2, 26, 0, 0, 0);
    const endDate = new Date(selectedYear, selectedMonth - 1, 25, 23, 59, 59);

    // bikin filter dasar
    const whereCondition = {
      location_code: req.params.locationCode,
      purchase_type: "MEMBERSHIP",
      statusPayment: "PAID",
      updatedAt: { [Op.between]: [startDate, endDate] },
    };

    // tambahin filter search (di location_name ATAU user.fullname)
    if (search) {
      whereCondition[Op.or] = [
        { location_name: { [Op.like]: `%${search}%` } },
        { "$trxHistoryUser.fullname$": { [Op.like]: `%${search}%` } },
      ];
    }

    const totalItems = await TransactionHistoryPayment.count({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "trxHistoryUser",
          attributes: [], // kosong biar count ga duplikat
        },
      ],
    });

    const totalPrice = await TransactionHistoryPayment.findOne({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("price")), "totalPrice"]],
      where: whereCondition,
      raw: true,
    });

    const response = await TransactionHistoryPayment.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "location_code",
        "location_name",
        "vehicle_type",
        "rfid",
        "updatedAt",
        "price",
        "product_name",
        "statusPayment",
      ],
      include: [
        {
          model: User,
          as: "trxHistoryUser",
          attributes: ["id", "fullname", "email", "points"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["updatedAt", "DESC"]],
    });

    return res.json({
      success: true,
      message: "Data retrieved successfully",
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
      totalPrice: totalPrice.totalPrice,
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getYearHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    const offset = (pageInt - 1) * limitInt;

    // Ambil semua tahun unik
    const years = await TransactionHistoryPayment.findAll({
      attributes: [
        [
          Sequelize.fn(
            "DISTINCT",
            Sequelize.fn("YEAR", Sequelize.col("createdAt"))
          ),
          "year",
        ],
      ],
      order: [[Sequelize.fn("YEAR", Sequelize.col("createdAt")), "DESC"]],
      raw: true,
    });

    const allYears = years.map((y) => y.year);

    // Total halaman dan data
    const totalItems = allYears.length;
    const totalPages = Math.ceil(totalItems / limitInt);

    // Ambil data yang sesuai dengan halaman saat ini
    const paginatedYears = allYears.slice(offset, offset + limitInt);

    res.json({
      data: paginatedYears,
      currentPage: pageInt,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching years" });
  }
};
