import { fn, literal, Op, Sequelize } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import MasterCard from "../../model/Members/v02/MasterCard.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";
import moment from "moment-timezone";

// Helper untuk menentukan kategori waktu
const getDateRange = (rangeType) => {
  const now = moment.tz("Asia/Jakarta");
  let startDate,
    endDate,
    format,
    categories = [];

  switch (rangeType) {
    case "week": {
      // Week biasa (senin–minggu, ikut DB fungsi WEEK)
      startDate = now.clone().startOf("week").toDate();
      endDate = now.clone().endOf("week").toDate();
      format = Sequelize.literal("WEEK(updatedAt, 1)");
      const startWeek = now.clone().startOf("week").week();
      const currentWeek = now.week();
      categories = Array.from(
        { length: currentWeek - startWeek + 1 },
        (_, i) => `Week ${startWeek + i}`
      );
      break;
    }

    case "month": {
      // revenue Agustus = 26 Juli – 25 Agustus
      if (now.date() >= 26) {
        // mulai tanggal 26 bulan ini
        startDate = now.clone().date(26).startOf("day").toDate();
        // sampai 25 bulan depan
        endDate = now.clone().add(1, "month").date(25).endOf("day").toDate();
      } else {
        // mulai 26 bulan lalu
        startDate = now
          .clone()
          .subtract(1, "month")
          .date(26)
          .startOf("day")
          .toDate();
        // sampai 25 bulan ini
        endDate = now.clone().date(25).endOf("day").toDate();
      }

      format = "%b"; // tampil bulan singkat
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
      // revenue tahun = 26 Des tahun lalu – 25 Des tahun ini
      if (now.month() === 11 && now.date() >= 26) {
        // Kalau sudah lewat 26 Des → tahun ini mulai 26 Des
        startDate = now.clone().date(26).month(11).startOf("day").toDate();
        endDate = now
          .clone()
          .add(1, "year")
          .month(11)
          .date(25)
          .endOf("day")
          .toDate();
      } else {
        // Kalau belum 26 Des → pakai 26 Des tahun lalu
        startDate = now
          .clone()
          .subtract(1, "year")
          .month(11)
          .date(26)
          .startOf("day")
          .toDate();
        endDate = now.clone().month(11).date(25).endOf("day").toDate();
      }

      format = "%b"; // tampil per bulan
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

    default: {
      // fallback: Jan 1 – today
      startDate = now.clone().startOf("year").toDate();
      endDate = now.toDate();
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

// Handler API untuk statistik Membership
export const getMembershipStatistics = async (req, res) => {
  try {
    const { range } = req.query;
    const { startDate, endDate, format, categories } = getDateRange(range);

    const transactions = await TransactionHistoryPayment.findAll({
      attributes: [
        [
          typeof format === "string"
            ? Sequelize.fn("DATE_FORMAT", Sequelize.col("updatedAt"), format)
            : format,
          "date",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("Id")), "count"],
        [Sequelize.fn("SUM", Sequelize.col("price")), "totalPrice"],
      ],
      where: {
        statusPayment: "PAID",
        // app_module: {
        //   [Op.in]: ["APP_MEMBERSHIP"],
        // },
        updatedAt: { [Op.between]: [startDate, endDate] },
      },
      group: ["date"],
      order: [["date", "ASC"]],
      raw: true,
    });

    // 🔁 Map data menjadi bentuk objek: { date: { count: ..., totalPrice: ... } }
    const dataMap = transactions.reduce((acc, trx) => {
      let key = range === "week" ? `Week ${trx.date}` : trx.date;
      acc[key] = {
        count: parseInt(trx.count),
        totalPrice: parseFloat(trx.totalPrice || 0),
      };
      return acc;
    }, {});

    // 📊 Buat array untuk masing-masing series
    const countSeries = categories.map((label) =>
      dataMap[label] ? dataMap[label].count : 0
    );
    const revenueSeries = categories.map((label) =>
      dataMap[label] ? dataMap[label].totalPrice : 0
    );

    const totalMemberships = countSeries.reduce((a, b) => a + b, 0);
    const totalRevenue = revenueSeries.reduce((a, b) => a + b, 0);

    // ✅ Kirim response
    res.json({
      categories,
      series: [
        { name: "Memberships", data: countSeries },
        { name: "Revenue", data: revenueSeries },
      ],
      totalMemberships,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
      startOfMonth = new Date(year, monthNumber - 2, 26, 0, 0, 0);
      // -2 karena JS month dimulai dari 0, dan kita ambil bulan sebelumnya

      // end: 25 bulan ini
      endOfMonth = new Date(year, monthNumber - 1, 25, 23, 59, 59);
    } else {
      // Kalau tidak ada query → pakai bulan sekarang
      const now = new Date();
      const year = now.getFullYear();
      const monthNumber = now.getMonth() + 1; // bulan sekarang (1–12)

      startOfMonth = new Date(year, monthNumber - 2, 26, 0, 0, 0);
      endOfMonth = new Date(year, monthNumber - 1, 25, 23, 59, 59);
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
    // start dari tanggal 26 bulan sebelumnya
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 26);

    // end di tanggal 25 bulan ini
    const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 25);

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
      // Parse dari "2025-07"
      const [year, monthNumber] = month.split("-").map(Number);

      // start = 26 bulan sebelumnya
      startOfMonth = new Date(year, monthNumber - 2, 26, 0, 0, 0);

      // end = 25 bulan ini
      endOfMonth = new Date(year, monthNumber - 1, 25, 23, 59, 59);
    } else {
      // Default: bulan berjalan (26 bulan lalu → 25 bulan ini)
      const now = new Date();

      startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        26,
        0,
        0,
        0
      );
      endOfMonth = new Date(now.getFullYear(), now.getMonth(), 25, 23, 59, 59);
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
      totalRevenue, // 👈 tambahan total keseluruhan
      data: result,
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
