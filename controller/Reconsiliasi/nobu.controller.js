import xlsx from "xlsx";
import { parse, format, addDays } from "date-fns";
import fs from "fs";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import { Op, Sequelize } from "sequelize";
import MutasiBank from "../../model/Members/v02/MutasiBank.js";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";

function normalizeRow(row) {
  const newRow = {};
  for (let key in row) {
    if (!row.hasOwnProperty(key)) continue;
    const cleanKey = key.trim(); // buang spasi kiri/kanan
    newRow[cleanKey] = row[key];
  }
  return newRow;
}

function excelDateToJSDate(serial) {
  // Excel mulai dari 1900-01-01 → JS Date "1899-12-30"
  return addDays(new Date(1899, 11, 30), serial);
}

export const processTxtContentNobu = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("File tidak ditemukan");
    }

    // baca workbook langsung dari buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    const sheetName = "Nobu Cash In New";
    if (!workbook.Sheets[sheetName]) {
      return res.status(400).send(`Sheet "${sheetName}" tidak ditemukan`);
    }

    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const vaData = [];

    for (let r of jsonData) {
      const row = normalizeRow(r);

      let date = row["Date"];
      const description = row["Description"] ? String(row["Description"]) : "";
      const debet = row["Credit"] || 0;

      if (!description) continue;

      const vaMatch = description.match(/8999\d{12,16}/);
      if (vaMatch) {
        const noVirtual = vaMatch[0];
        const amount = parseInt(debet.toString().replace(/[^\d]/g, "")) || 0;
        // konversi date excel ke YYYY-MM-DD
        let formattedDate = "";
        if (!isNaN(date)) {
          const jsDate = excelDateToJSDate(Number(date));
          formattedDate = format(jsDate, "yyyy-MM-dd");
        }

        // console.log(formattedDate, debet, noVirtual, amount);
        vaData.push({ date: formattedDate, noVirtual, amount, description });
      }
    }

    const results = [];
    for (let trx of vaData) {
      const matchedPayment = await PaymentTransaction.findOne({
        where: {
          virtual_account_number: trx.noVirtual,
          paid_amount: trx.amount,
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn("DATE", Sequelize.col("updated_at")),
              trx.date // ambil hanya YYYY-MM-DD
            ),
          ],
        },
      });

      const data = {
        trxDate: trx.date,
        noVirtualAcount: trx.noVirtual,
        amount: Number(trx.amount),
        status: "UNMATCHED", // default UNMATCHED
        productName: null,
        vehicleType: null,
        bankName: null,
        transactionNo: null, // kalau nanti dapat matched, diisi
        startDate: null,
        endDate: null,
        rfid: null,
        platNumber: null,
        uploadedBy: "admin",
        locationName: null,
        transferDate: trx.date,
        uniqueKey: null, // utk unmatched
      };

      if (matchedPayment) {
        data.status = "MATCHED";
        data.bankName = matchedPayment.module_name;
        data.transactionNo = matchedPayment.trx_id;

        // compare ke TransactionHistory
        const trxHistory = await TransactionHistoryPayment.findOne({
          where: {
            trxId: matchedPayment.trx_id,
          },
        });

        console.log("data", trxHistory);

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

          // isi data meskipun memberStatus/vehicleData tidak ada
          data.startDate = memberStatus ? memberStatus.updated_at : null;
          data.endDate = memberStatus ? memberStatus.end_date : null;
          data.rfid = vehicleData ? vehicleData.rfid : "-";
          data.platNumber = vehicleData ? vehicleData.plate_number : "-";
          data.typePurchase = trxHistory.product_name || "-";
          data.vehicleType = trxHistory.vehicle_type || "-";
          data.uploadedBy = "admin";
          data.locationName = trxHistory.location_name || "-";
        }
      }

      results.push(data);
    }

    console.log("inserted:", results);
    let inserted = 0;
    let skipped = 0;

    if (results.length > 0) {
      // ambil semua transactionNo yang valid
      const trxNos = results.map((r) => r.transactionNo).filter((t) => t); // hanya yang punya transactionNo

      let existingSet = new Set();
      if (trxNos.length > 0) {
        const existing = await MutasiBank.findAll({
          attributes: ["transactionNo"],
          where: { transactionNo: trxNos },
          raw: true,
        });
        existingSet = new Set(existing.map((e) => e.transactionNo));
      }

      // filter baru: hanya data yang punya trxId dan belum ada di DB
      const newData = results.filter(
        (r) => !r.transactionNo || !existingSet.has(r.transactionNo)
      );

      if (newData.length > 0) {
        const created = await MutasiBank.bulkCreate(newData, {
          ignoreDuplicates: true,
        });
        inserted = created.length;
      }

      skipped = results.length - inserted;
    }
    console.log("inserted:", inserted, "skipped:", skipped);
    return res.json({
      total_excel: vaData.length,
      inserted,
      skipped,
      data: results,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
};
