import fs from "fs";
import readline from "readline";
import MutasiBank from "../../model/Members/v02/MutasiBank.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import TennantPurchaseHistory from "../../model/Members/v02/TenantPurchaseHistory.js";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import { endOfDay, format, parse, startOfDay } from "date-fns";
import { Op, Sequelize } from "sequelize";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";

// function untuk parsing file
export const processTxtContent = async function (fileContent, userId) {
  const lines = fileContent.split(/\r?\n/);
  const results = [];

  let perusahaanId = null;
  let transferDate = null;

  for (const line of lines) {
    if (line.includes("NAMA PERUSAHAAN")) {
      const match = line.match(/NAMA PERUSAHAAN\s*:\s*(\d+)/);
      if (match) perusahaanId = match[1];
    }

    if (line.includes("TANGGAL")) {
      const matchDate = line.match(/TANGGAL\s*:\s*(\d{2}\/\d{2}\/\d{2})/);
      if (matchDate) {
        const tgl = matchDate[1];
        const tglObj = parse(tgl, "dd/MM/yy", new Date());
        transferDate = format(tglObj, "yyyy-MM-dd");
      }
    }

    const trxMatch = line.match(
      /^\s*\d+\s+(\d+)\s+(.+?)\s+IDR\s+([\d,]+\.\d{2})\s+(\d{2}\/\d{2}\/\d{2})\s+\d{2}:\d{2}:\d{2}\s+\w+\s+(\d+)/
    );

    if (line.match(/^\s*\d+\s/)) {
      // baris transaksi
      if (!trxMatch) {
        console.log("⚠️ Tidak terparse:", line);
      }
    }

    if (trxMatch && perusahaanId && transferDate) {
      const noPelanggan = trxMatch[1];
      const amount = parseFloat(trxMatch[3].replace(/,/g, ""));
      const trxDate = trxMatch[4];
      const keterangan1 = trxMatch[5];
      const noVirtual = perusahaanId + noPelanggan;
      const trxDateObj = parse(trxDate, "dd/MM/yy", new Date());
      const trxDateStr = format(trxDateObj, "yyyy-MM-dd");

      const data = {
        trxDate: trxDateStr,
        noVirtualAcount: noVirtual,
        amount,
        status: "UNMATCHED", // default UNMATCHED
        productName: null,
        vehicleType: null,
        bankName: null,
        transactionNo: null, // kalau nanti dapat matched, diisi
        startDate: null,
        endDate: null,
        rfid: null,
        platNumber: null,
        uploadedBy: userId || "admin",
        locationName: null,
        transferDate: transferDate,
        uniqueKey: keterangan1, // utk unmatched
      };

      // === Cek PaymentTransaction ===
      const matchedPayment = await PaymentTransaction.findOne({
        where: {
          virtual_account_number: noVirtual,
          paid_amount: amount,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("DATE", Sequelize.col("updated_at")),
              "=",
              trxDateStr
            ),
          ],
        },
      });

      if (matchedPayment) {
        // ambil detail transaksi
        const trxHistory = await TransactionHistoryPayment.findOne({
          where: { trxId: matchedPayment.trx_id },
        });

        if (trxHistory) {
          let memberStatus = null;
          let vehicleData = null;

          if (trxHistory.invoice_id) {
            memberStatus = await MembershipDetail.findOne({
              where: { invoice_id: trxHistory.invoice_id },
            });

            if (memberStatus) {
              vehicleData = await VehicleList.findOne({
                where: { id: memberStatus.Cust_Member },
              });
            }
          }

          data.status = "MATCHED";
          data.bankName = matchedPayment.module_name;
          data.transactionNo = matchedPayment.trx_id;
          data.startDate = memberStatus ? memberStatus.updated_at : null;
          data.endDate = memberStatus ? memberStatus.end_date : null;
          data.rfid = vehicleData ? vehicleData.rfid : "-";
          data.platNumber = vehicleData ? vehicleData.plate_number : "-";
          data.typePurchase = trxHistory.product_name || "-";
          data.vehicleType = trxHistory.vehicle_type || "-";
          data.locationName = trxHistory.location_name || "-";
        }
      }

      results.push(data);
    }
  }

  // === Insert ke MutasiBank ===
  let inserted = 0;
  let skipped = 0;

  if (results.length > 0) {
    // Ambil existing data dari DB
    const trxNos = results.map((r) => r.transactionNo).filter(Boolean); // yg ada trxNo
    const uniqKeys = results.map((r) => r.uniqueKey).filter(Boolean); // unmatched

    let existingSet = new Set();
    if (uniqKeys.length > 0) {
      const existing = await MutasiBank.findAll({
        attributes: ["uniqueKey"],
        where: { uniqueKey: uniqKeys },
        raw: true,
      });

      existing.forEach((e) => {
        if (e.uniqueKey) existingSet.add(`key:${e.uniqueKey}`);
      });
    }

    // Filter: kalau MATCHED → cek trxNo, kalau UNMATCHED → cek uniqueKey
    const newData = results.filter((r) => {
      if (r.transactionNo) {
        return !existingSet.has(`trx:${r.transactionNo}`);
      } else {
        return !existingSet.has(`key:${r.uniqueKey}`);
      }
    });

    if (newData.length > 0) {
      const created = await MutasiBank.bulkCreate(newData, {
        ignoreDuplicates: true,
      });
      inserted = created.length;
    }

    skipped = results.length - inserted;
  }

  return {
    total: results.length,
    inserted,
    skipped,
    data: results,
  };
};

export const getSummaryByYear = async (req, res) => {
  try {
    const { year, page = 1, limit = 10, bankName } = req.query;

    if (!year) {
      return res.status(400).json({ message: "year required" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = Sequelize.where(
      Sequelize.fn("YEAR", Sequelize.col("trxDate")),
      year
    );

    // kalau ada filter bankName
    const finalWhere = bankName
      ? { [Op.and]: [whereClause, { bankName }] }
      : whereClause;

    // 1️⃣ ambil semua bulan dalam tahun tsb
    const { count, rows } = await MutasiBank.findAndCountAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("trxDate"), "%Y-%m"),
          "month",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalTransaction"],
        [Sequelize.fn("SUM", Sequelize.col("amount")), "totalAmount"],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN status = 'MATCHED' THEN 1 ELSE 0 END")
          ),
          "matchedCount",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN status = 'UNMATCHED' THEN 1 ELSE 0 END"
            )
          ),
          "unmatchedCount",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN typePurchase = 'TOP UP' THEN 1 ELSE 0 END"
            )
          ),
          "topupCount",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN typePurchase <> 'TOP UP' THEN 1 ELSE 0 END"
            )
          ),
          "nonTopupCount",
        ],
      ],
      where: finalWhere,
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("trxDate"), "%Y-%m")],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("trxDate"), "%Y-%m"),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      offset,
      raw: true,
    });

    return res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count.length / limit),
        totalRows: count.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server Error", error: err.message });
  }
};

export const getDetailSummary = async (req, res) => {
  try {
    const { date, page = 1, limit = 10, search = "", bankName } = req.query;

    if (!date) {
      return res.status(400).json({ message: "month (YYYY-MM-dd) required" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // filter base
    const whereClause = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn(
            "DATE",
            Sequelize.fn(
              "CONVERT_TZ",
              Sequelize.col("transferDate"),
              "+00:00",
              "+07:00"
            ) // UTC -> WIB
          ),
          date
        ),
      ],
    };

    // kalau ada filter bankName
    if (bankName) {
      whereClause[Op.and].push({ bankName });
    }

    // kalau ada search (ke semua field string/number)
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { locationName: { [Op.like]: `%${search}%` } },
          { bankName: { [Op.like]: `%${search}%` } },
          { transactionNo: { [Op.like]: `%${search}%` } },
          { trxDate: { [Op.like]: `%${search}%` } },
          { noVirtualAcount: { [Op.like]: `%${search}%` } },
          { typePurchase: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    const totalRows = await MutasiBank.count({ where: whereClause });

    // ambil data
    let rows = [];
    if (offset < totalRows) {
      rows = await MutasiBank.findAll({
        where: whereClause,
        order: [["transferDate", "DESC"]],
        limit: parseInt(limit),
        offset,
      });
    }

    return res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRows / limit),
        totalRows,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getSummaryByMonthDetail = async (req, res) => {
  try {
    const { month, page = 1, limit = 10, bankName } = req.query;

    if (!month) {
      return res.status(400).json({ message: "month (YYYY-MM) required" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = Sequelize.where(
      Sequelize.fn("DATE_FORMAT", Sequelize.col("transferDate"), "%Y-%m"),
      month
    );

    // kalau ada filter bankName
    const finalWhere = bankName
      ? { [Op.and]: [whereClause, { bankName }] }
      : whereClause;

    const { count, rows } = await MutasiBank.findAndCountAll({
      attributes: [
        [
          Sequelize.fn(
            "DATE_FORMAT",
            Sequelize.col("transferDate"),
            "%Y-%m-%d"
          ),
          "date",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalTransaction"],
        [Sequelize.fn("SUM", Sequelize.col("amount")), "totalAmount"],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN status = 'MATCHED' THEN 1 ELSE 0 END")
          ),
          "matchedCount",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN status = 'UNMATCHED' THEN 1 ELSE 0 END"
            )
          ),
          "unmatchedCount",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN typePurchase = 'TOP UP' THEN 1 ELSE 0 END"
            )
          ),
          "topupCount",
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN typePurchase <> 'TOP UP' THEN 1 ELSE 0 END"
            )
          ),
          "nonTopupCount",
        ],
      ],
      where: finalWhere,
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("transferDate"), "%Y-%m-%d"),
      ],
      order: [
        [
          Sequelize.fn(
            "DATE_FORMAT",
            Sequelize.col("transferDate"),
            "%Y-%m-%d"
          ),
          "ASC",
        ],
      ],
      limit: parseInt(limit),
      offset,
      raw: true,
    });

    return res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count.length / limit),
        totalRows: count.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server Error", error: err.message });
  }
};
