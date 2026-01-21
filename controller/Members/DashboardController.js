import { fn, literal, Op, Sequelize } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import MasterCard from "../../model/Members/v02/MasterCard.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";
import moment from "moment-timezone";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  formatDate,
} from "date-fns";

// Helper untuk menentukan kategori waktu
const getDateRange = (rangeType) => {
  const now = moment.tz("Asia/Jakarta");
  let startDate,
    endDate,
    format,
    categories = [];

  switch (rangeType) {
    case "week": {
      startDate = now.clone().startOf("week").toDate();
      endDate = now.clone().endOf("week").toDate();
      format = Sequelize.literal("WEEK(updatedAt, 1)");
      const currentWeek = now.week();
      categories = Array.from({ length: 1 }, () => `Week ${currentWeek}`);
      break;
    }

    case "month": {
      // ambil Januari – Desember tahun berjalan
      startDate = now.clone().startOf("year").toDate();
      endDate = now.clone().endOf("year").toDate();
      format = "%b"; // Jan, Feb, dst
      categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      break;
    }

    case "year": {
      // ambil 5 tahun terakhir
      startDate = now.clone().subtract(4, "year").startOf("year").toDate();
      endDate = now.clone().endOf("year").toDate();
      format = "%Y"; // 2021, 2022, dst
      categories = Array.from({ length: 5 }, (_, i) =>
        (now.year() - 4 + i).toString()
      );
      break;
    }

    default: {
      startDate = now.clone().startOf("year").toDate();
      endDate = now.clone().endOf("year").toDate();
      format = "%b";
      categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }
  }

  return { startDate, endDate, format, categories };
};

export const getMembershipStatistics = async (req, res) => {
  try {
    const { range } = req.query;

    let startDate, endDate, format, categories;

    // 📌 RANGE: MONTH (Jan–Dec dalam setahun)
    if (range === "month") {
      startDate = startOfYear(new Date());
      endDate = endOfYear(new Date());

      format = Sequelize.fn("DATE_FORMAT", Sequelize.col("updatedAt"), "%b");
      categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }

    // 📌 RANGE: YEAR (satu tahun ini)
    else if (range === "year") {
      const now = new Date();
      const currentYear = now.getFullYear();

      // mulai dari 2020
      startDate = new Date(2020, 0, 1, 0, 0, 0);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);

      // Grouping by YEAR
      format = Sequelize.fn("YEAR", Sequelize.col("updatedAt"));

      // generate kategori tahun dari 2020 sampai tahun sekarang
      categories = Array.from({ length: currentYear - 2020 + 1 }, (_, i) =>
        (2020 + i).toString()
      );
    }

    // 📌 RANGE: DAY (harian dalam bulan berjalan)
    else if (range === "day") {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());

      format = Sequelize.fn("DAY", Sequelize.col("updatedAt"));

      // Generate array [1, 2, ..., 30/31]
      categories = eachDayOfInterval({ start: startDate, end: endDate }).map(
        (d) => formatDate(d, "d")
      );
    }

    // 📌 DEFAULT: fallback ke month
    else {
      startDate = startOfYear(new Date());
      endDate = endOfYear(new Date());

      format = Sequelize.fn("DATE_FORMAT", Sequelize.col("updatedAt"), "%b");
      categories = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }

    // 🔎 Query
    const transactions = await TransactionHistoryPayment.findAll({
      attributes: [
        [format, "date"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalPrice"],
      ],
      where: {
        statusPayment: "PAID",
        updatedAt: { [Op.between]: [startDate, endDate] },
      },
      group: ["date"],
      order: [[Sequelize.literal("date"), "ASC"]],
      raw: true,
    });

    // 📌 Map hasil query ke kategori
    const dataMap = transactions.reduce((acc, trx) => {
      const key = range === "day" ? trx.date.toString() : trx.date;
      acc[key] = {
        count: parseInt(trx.count, 10),
        totalPrice: parseFloat(trx.totalPrice || 0),
      };
      return acc;
    }, {});

    const countSeries = categories.map((label) => dataMap[label]?.count || 0);
    const revenueSeries = categories.map(
      (label) => dataMap[label]?.totalPrice || 0
    );

    res.json({
      status: "success",
      categories,
      series: [
        { name: "Memberships", data: countSeries },
        { name: "Revenue", data: revenueSeries },
      ],
      totalMemberships: countSeries.reduce((a, b) => a + b, 0),
      totalRevenue: revenueSeries.reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const totalValue = async (req, res) => {
  try {
    const { month } = req.query;

    let startOfMonth, endOfMonth;

    if (month) {
      // Parse dari "2025-09"
      const [year, monthNumber] = month.split("-").map(Number);

      // start: 26 bulan sebelumnya
      startOfMonth = new Date(year, monthNumber - 1, 1, 0, 0, 0);
      // -2 karena JS month dimulai dari 0, dan kita ambil bulan sebelumnya

      // end: 25 bulan ini
      endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59);
    } else {
      // Kalau tidak ada query → pakai bulan sekarang
      const now = new Date();
      const year = now.getFullYear();
      const monthNumber = now.getMonth(); // bulan sekarang (1–12)

      startOfMonth = new Date(year, monthNumber - 1, 1, 0, 0, 0);
      endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59);
    }

    const totalMembershipActive = await MembershipDetail.count({
      where: {
        is_active: 1,
        end_date: {
          [Op.gt]: new Date(), // membership masih berlaku
        },
      },
    });

    const totalMembershipNonActive = await MembershipDetail.count({
      where: {
        is_active: 0,
        end_date: {
          [Op.lt]: new Date(), // membership sudah lewat
        },
      },
    });

    const totalBalancePoint = await User.sum("Points");

    const totalPrice = await TransactionHistoryPayment.findOne({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("price")), "totalPrice"]],
      where: {
        statusPayment: "PAID",
        purchase_type: {
          [Op.in]: ["MEMBERSHIP"],
        },
        updatedAt: {
          [Op.between]: [startOfMonth, endOfMonth], // Gunakan filter bulan yang sama
        },
      },
      raw: true,
    });

    const totalTopup = await TransactionHistoryPayment.findOne({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("price")), "totalPrice"]],
      where: {
        statusPayment: "PAID",
        purchase_type: {
          [Op.in]: ["TOPUP"],
        },
        updatedAt: {
          [Op.between]: [startOfMonth, endOfMonth], // Gunakan filter bulan yang sama
        },
      },
      raw: true,
    });

    const totalByModule = await TransactionHistoryPayment.findAll({
      attributes: [
        "purchase_type",
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalPaid"],
      ],
      where: {
        statusPayment: "PAID",
        purchase_type: {
          [Op.in]: ["MEMBERSHIP"],
        },
        updatedAt: {
          [Op.between]: [startOfMonth, endOfMonth], // Gunakan filter bulan yang sama
        },
      },
      group: ["purchase_type"],
      raw: true,
    });

    const totalOverall = totalByModule.reduce(
      (sum, row) => sum + parseFloat(row.totalPaid),
      0
    );

    const valueByModule = totalByModule.map((row) => {
      const totalPaid = parseFloat(row.totalPaid);
      const percentage =
        totalOverall > 0 ? (totalPaid / totalOverall) * 100 : 0;
      return {
        app_module: row.app_module,
        totalPaid,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    const totalByProduct = await TransactionHistoryPayment.findAll({
      attributes: [
        "product_name",
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalPaid"],
      ],
      where: {
        statusPayment: "PAID",
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth], // Gunakan filter bulan yang sama
        },
      },
      group: ["product_name"],
      raw: true,
    });

    const totalOverallProduct = totalByProduct.reduce(
      (sum, row) => sum + parseFloat(row.totalPaid),
      0
    );

    const valueByProduct = totalByProduct.map((row) => {
      const totalPaid = parseFloat(row.totalPaid);
      const percentage =
        totalOverallProduct > 0 ? (totalPaid / totalOverall) * 100 : 0;
      return {
        product: row.product_name,
        totalPaid,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Success",
      totalMembershipActive,
      totalMembershipNonActive,
      totalPrice,
      totalTopup,
      totalBalancePoint,
      valueByModule,
      valueByProduct,
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listSummaryLocation = async (req, res) => {
  try {
    const now = new Date();
    // tanggal 1 bulan ini jam 00:00:00
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0
    );

    // tanggal terakhir bulan ini jam 23:59:59
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // 1. Ambil total member aktif
    const activeMembers = await MembershipDetail.findAll({
      attributes: [
        "location_id",
        [Sequelize.col("locationArea.location_name"), "location_name"],
        [
          Sequelize.fn("COUNT", Sequelize.col("customer_membership_detail.id")),
          "totalActive",
        ],
      ],
      include: [{ model: LocationArea, as: "locationArea", attributes: [] }],
      where: {
        is_active: 1,
        end_date: { [Op.gte]: now },
      },
      group: [
        "customer_membership_detail.location_id",
        "locationArea.location_name",
      ],
      raw: true,
    });

    // 2. Ambil total member non-aktif
    const inactiveMembers = await MembershipDetail.findAll({
      attributes: [
        "location_id",
        [Sequelize.col("locationArea.location_name"), "location_name"],
        [
          Sequelize.fn("COUNT", Sequelize.col("customer_membership_detail.id")),
          "totalInactive",
        ],
      ],
      include: [{ model: LocationArea, as: "locationArea", attributes: [] }],
      where: {
        is_active: 0,
        end_date: { [Op.lt]: now },
      },
      group: [
        "customer_membership_detail.location_id",
        "locationArea.location_name",
      ],
      raw: true,
    });

    // 3. Ambil total revenue per lokasi (JOIN ke LocationArea biar dapat nama lokasi)
    const revenue = await TransactionHistoryPayment.findAll({
      attributes: [
        "location_code",
        [Sequelize.col("locationArea.location_name"), "location_name"],
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalRevenue"],
      ],
      include: [{ model: LocationArea, as: "locationArea", attributes: [] }],
      where: {
        statusPayment: "PAID",
        purchase_type: { [Op.in]: ["MEMBERSHIP"] },
        createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
      },
      group: ["location_code", "locationArea.location_name"],
      raw: true,
    });

    // 4. Gabungkan semua ke dalam satu array
    const locationMap = new Map();

    // Masukkan data aktif
    activeMembers.forEach((item) => {
      locationMap.set(item.location_name, {
        location_name: item.location_name,
        totalActive: Number(item.totalActive) || 0,
        totalInactive: 0,
        totalRevenue: 0,
      });
    });

    // Masukkan data non-aktif
    inactiveMembers.forEach((item) => {
      const entry = locationMap.get(item.location_name) || {
        location_name: item.location_name,
        totalActive: 0,
        totalInactive: 0,
        totalRevenue: 0,
      };
      entry.totalInactive = Number(item.totalInactive) || 0;
      locationMap.set(item.location_name, entry);
    });

    // Masukkan data revenue
    revenue.forEach((item) => {
      const entry = locationMap.get(item.location_name) || {
        location_name: item.location_name,
        totalActive: 0,
        totalInactive: 0,
        totalRevenue: 0,
      };
      entry.totalRevenue = Number(item.totalRevenue) || 0;
      locationMap.set(item.location_name, entry);
    });

    const result = Array.from(locationMap.values());

    return res.status(200).json({
      status: "success",
      message: "Summary per location",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching location summary:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const summaryByProduct = async (req, res) => {
  try {
    const { month } = req.query;

    let startOfMonth, endOfMonth;

    if (month) {
      // Parse dari "2025-09"
      const [year, monthNumber] = month.split("-").map(Number);

      // start: 26 bulan sebelumnya
      startOfMonth = new Date(year, monthNumber - 1, 1, 0, 0, 0);
      // -2 karena JS month dimulai dari 0, dan kita ambil bulan sebelumnya

      // end: 25 bulan ini
      endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59);
    } else {
      // Kalau tidak ada query → pakai bulan sekarang
      const now = new Date();
      const year = now.getFullYear();
      const monthNumber = now.getMonth() + 1; // bulan sekarang (1–12)

      startOfMonth = new Date(year, monthNumber - 1, 1, 0, 0, 0);
      endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59);
    }

    const result = await TransactionHistoryPayment.findAll({
      attributes: [
        "product_name",
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalRevenue"],
      ],
      where: {
        statusPayment: "PAID",
        updatedAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      group: ["product_name"],
      order: [[fn("SUM", literal("CAST(price AS UNSIGNED)")), "DESC"]],
      raw: true,
    });

    // Hitung total revenue keseluruhan
    const totalRevenue = result.reduce(
      (sum, item) => sum + Number(item.totalRevenue || 0),
      0
    );

    return res.status(200).json({
      status: "success",
      message: "Success",
      range: { start: startOfMonth, end: endOfMonth },
      totalRevenue,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMembershipStatisticsByRange = async (req, res) => {
  try {
    const { range } = req.query; // default 90d
    let days = 90;
    if (range === "30d") days = 30;
    else if (range === "7d") days = 7;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const transactions = await TransactionHistoryPayment.findAll({
      where: {
        updatedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("updatedAt")), "date"],
        [Sequelize.fn("COUNT", Sequelize.col("trxId")), "trxCount"],
        [Sequelize.fn("SUM", Sequelize.col("price")), "trxTotal"],
      ],
      group: ["date"],
      raw: true,
    });

    const chartData = transactions.map((t) => ({
      date: t.date,
      transactionCount: parseInt(t.trxCount, 10),
      totalAmount: parseFloat(t.trxTotal || 0),
    }));

    res.json({ success: true, data: chartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
