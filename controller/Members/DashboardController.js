import { Op, Sequelize } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import MasterCard from "../../model/Members/v02/MasterCard.js";

// Helper untuk menentukan kategori waktu
const getDateRange = (rangeType) => {
  const now = new Date();
  let startDate;
  let format;
  let categories = [];

  switch (rangeType) {
    case "days": {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate = new Date(weekStart);
      format = "%a"; // Nama hari singkat (Sun, Mon, ...)
      categories = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      break;
    }
    case "week": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = new Date(monthStart);
      format = Sequelize.literal(
        "CONCAT('Week ', WEEK(createdAt, 1) - WEEK(DATE_SUB(createdAt, INTERVAL DAYOFMONTH(createdAt)-1 DAY), 1) + 1)"
      ); // Perbaikan
      const totalWeeks = Math.ceil((now.getDate() + monthStart.getDay()) / 7);
      categories = Array.from(
        { length: totalWeeks },
        (_, i) => `Week ${i + 1}`
      );
      break;
    }
    case "month": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      startDate = new Date(yearStart);
      format = "%b"; // Nama bulan (Jan, Feb, ...)
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
      startDate = new Date(now.getFullYear() - 6, 0, 1);
      format = "%Y"; // Tahun
      categories = Array.from({ length: 7 }, (_, i) =>
        (now.getFullYear() - 6 + i).toString()
      );
      break;
    }
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
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

  return { startDate, endDate: new Date(), format, categories };
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
            ? Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), format)
            : format,
          "date",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: {
        purchase_type: "MEMBERSHIP",
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      group: ["date"],
      order: [["date", "ASC"]],
    });

    // Ubah hasil query ke dalam bentuk dictionary
    const dataMap = transactions.reduce((acc, trx) => {
      acc[trx.dataValues.date] = trx.dataValues.count;
      return acc;
    }, {});

    // Susun ulang agar sesuai dengan urutan kategori
    const seriesData = categories.map((label) => dataMap[label] || 0);

    // Hitung total semua transaksi dalam rentang waktu yang dipilih
    const totalMemberships = seriesData.reduce((a, b) => a + b, 0);

    res.json({ categories, series: seriesData, total: totalMemberships });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const totalValue = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Tanggal 1 bulan ini
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalMembershipActive = await User.count({
      where: {
        is_active: 1,
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        },
      },
    });
    const totalMembershipNonActive = await User.count({
      where: {
        is_active: 0,
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        },
      },
    });

    const totalPrice = await TransactionHistoryPayment.findOne({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("price")), "totalPrice"]],
      where: {
        statusPayment: "PAID", // Hanya transaksi yang sudah dibayar
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        },
      },
      raw: true, // Supaya hasilnya langsung objek biasa, bukan instance Sequelize
    });

    const CardUsed = await MasterCard.count({
      where: {
        is_used: 1,
        // created_at: {
        //   [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        // },
      },
    });

    const CardNotUsed = await MasterCard.count({
      where: {
        is_used: 0,
        // created_at: {
        //   [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        // },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Success",
      totalMembershipActive,
      totalMembershipNonActive,
      totalPrice,
      CardUsed,
      CardNotUsed,
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
