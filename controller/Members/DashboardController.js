import { Op, Sequelize } from "sequelize";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import User from "../../model/Members/Users.js";
import MasterCard from "../../model/Members/v02/MasterCard.js";

// Helper untuk menentukan kategori waktu
const getDateRange = (rangeType) => {
  const now = new Date();
  let startDate,
    format,
    categories = [];

  switch (rangeType) {
    case "days": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      format = "%Y-%m-%d"; // Format tanggal lengkap
      const today = now.getDate();
      categories = Array.from(
        { length: today },
        (_, i) =>
          new Date(now.getFullYear(), now.getMonth(), i + 1)
            .toISOString()
            .split("T")[0]
      );
      break;
    }

    case "week": {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const firstDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const firstDayOfThisMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      startDate = firstDayOfLastMonth; // Mulai dari awal bulan lalu
      format = Sequelize.literal("WEEK(createdAt, 1)"); // Ambil nomor minggu sejak awal tahun

      // Hitung minggu pertama dari bulan lalu
      const weekStart = Math.ceil(
        ((firstDayOfLastMonth - firstDayOfYear) / (1000 * 60 * 60 * 24) +
          firstDayOfYear.getDay() +
          1) /
          7
      );

      // Hitung minggu terakhir bulan ini
      const currentWeek = Math.ceil(
        ((now - firstDayOfYear) / (1000 * 60 * 60 * 24) +
          firstDayOfYear.getDay() +
          1) /
          7
      );

      // Buat array kategori yang benar (mulai dari minggu bulan lalu hingga minggu sekarang)
      categories = Array.from(
        { length: currentWeek - weekStart + 1 },
        (_, i) => `Week ${weekStart + i}`
      );

      break;
    }

    case "month": {
      startDate = new Date(now.getFullYear(), 0, 1);
      format = "%b"; // Format bulan singkat (Jan, Feb, Mar, ...)
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
      startDate = new Date(now.getFullYear() - 2, 0, 1);
      format = "%Y"; // Format tahun
      categories = Array.from({ length: 3 }, (_, i) =>
        (now.getFullYear() - 2 + i).toString()
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

    console.log(
      "Transactions:",
      transactions.map((trx) => trx.dataValues)
    );
    console.log("Categories:", categories);

    const dataMap = transactions.reduce((acc, trx) => {
      let key =
        range === "week" ? `Week ${trx.dataValues.date}` : trx.dataValues.date;
      acc[key] = trx.dataValues.count;
      return acc;
    }, {});

    console.log("DataMap:", dataMap);

    const seriesData = categories.map((label) => dataMap[label] || 0);
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
        // created_at: {
        //   [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        // },
      },
    });
    const totalMembershipNonActive = await User.count({
      where: {
        is_active: 0,
        // created_at: {
        //   [Op.between]: [startOfMonth, endOfMonth], // Filter bulan ini
        // },
      },
    });

    const totalBalancePoint = await User.sum("Points");

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
      totalBalancePoint,
      CardUsed,
      CardNotUsed,
    });
  } catch (error) {
    console.error("Error fetching membership statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
