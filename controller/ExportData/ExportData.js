import User from "../../model/Members/Users.js";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import ExcelJs from "exceljs";
import moment from "moment/moment.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import { Op, Sequelize } from "sequelize";
import { errorResponse } from "../../config/response.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";

export const exportDataTransaksiPost = async (req, res) => {
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const statusMember = req.query.statusMember;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    const dateCondition =
      startDate && endDate
        ? {
            createdAt: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : null;

    if (statusMember) {
      whereClause.status_member = statusMember;
    }

    const result = await HistoryPost.findAndCountAll({
      where: {
        ...whereClause,
        ...(dateCondition ? dateCondition : {}),
      },
      include: [
        {
          model: User,
          as: "userHistoryPost",
          attributes: ["fullname", "email"],
        },
      ],
    });

    if (result.count > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Location Code", width: 20, key: "location_code" },
        { header: "Location Name", width: 35, key: "location_name" },
        { header: "Customer Name", width: 35, key: "username" },
        { header: "Plate Number", width: 20, key: "plate_number" },
        { header: "Status Membership", width: 20, key: "status_membership" },
        { header: "In Time", width: 30, key: "in_time" },
        { header: "Out TIme", width: 30, key: "out_time" },
        { header: "Tariff", width: 20, key: "tariff" },
        { header: "Status", width: 20, key: "status" },
      ];

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      });

      for (const [index, value] of result.rows.entries()) {
        const row = worksheet.addRow({
          No: index + 1,
          location_code: value.location_code || "-",
          location_name: value.location_name || "-",
          username: value.userHistoryPost
            ? value.userHistoryPost?.fullname
            : "-",
          plate_number: value.plate_number || "-",
          status_membership: value.status_member || "-",
          in_time: value.gate_in_time
            ? moment(value.gate_in_time)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          out_time: value.gate_out_time
            ? moment(value.gate_out_time)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          tariff: value.tariff || "-",
          status: value.is_close === 1 ? "Out Area Parking" : "In Area Parking",
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

      const fileName = startDate
        ? `History_post_${startDate}_to_${endDate}.xlsx`
        : `history_post_alldate.xlsx`;

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

export const exportHistoryTransaction = async (req, res) => {
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const type = req.query.type;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    if (type === "TOPUP") {
      whereClause.purchase_type = "TOPUP";
    }

    if (type === "MEMBERSHIP") {
      whereClause.purchase_type = "MEMBERSHIP";
    }

    const dateCondition =
      startDate && endDate
        ? {
            createdAt: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : null;

    const result = await TransactionHistoryPayment.findAndCountAll({
      where: {
        ...whereClause,
        ...(dateCondition ? dateCondition : {}),
        statusPayment: "PAID",
      },
      include: [
        {
          model: User,
          as: "trxHistoryUser",
          attributes: ["fullname", "email"],
        },
        {
          model: MembershipDetail,
          required: false,
          as: "membershipDetail",
          attributes: ["start_date", "end_date"],
          where: {
            is_active: 1,
          },
        },
      ],
    });

    if (result.count > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", width: 20, key: "dateTransaction" },
        { header: "Transaction Time", width: 20, key: "timeTransaction" },
        { header: "Transaction Code", width: 30, key: "trxId" },
        { header: "Invoice No", width: 40, key: "invoice_id" },
        { header: "Name", width: 35, key: "fullname" },
        { header: "Email", width: 35, key: "email" },
        { header: "No Card", width: 35, key: "rfid" },
        { header: "Vehicle Type", width: 35, key: "vehicle_type" },
        { header: "Virtual Account Number", width: 35, key: "virtual_account" },
        { header: "Product Name", width: 35, key: "product_name" },
        { header: "Start Date", width: 20, key: "start_date" },
        { header: "End Date", width: 20, key: "end_date" },
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
          dateTransaction: value.createdAt
            ? moment(value.createdAt).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          timeTransaction: value.createdAt
            ? moment(value.createdAt).tz("Asia/Jakarta").format("HH:mm:ss")
            : "-",
          trxId: value.trxId || "-",
          invoice_id: value.invoice_id || "-",
          fullname: value.trxHistoryUser ? value.trxHistoryUser?.fullname : "-",
          email: value.trxHistoryUser ? value.trxHistoryUser?.email : "-",
          rfid: value.rfid ? value.rfid : "-",
          vehicle_type: value.vehicle_type ? value.vehicle_type : "-",
          virtual_account: value.virtual_account || "-",
          product_name: value.product_name || "-",
          start_date: value.membershipDetail?.start_date
            ? moment(value.membershipDetail.start_date).format("YYYY-MM-DD")
            : "-",
          end_date: value.membershipDetail?.end_date
            ? moment(value.membershipDetail.end_date).format("YYYY-MM-DD")
            : "-",
          purchase_type: value.purchase_type || "-",
          transactionType: value.transactionType || "-",
          price: value.price ? Number(value.price) : "",
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

      const fileName = startDate
        ? `History_transaction_${startDate}_to_${endDate}.xlsx`
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
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    const dateCondition =
      startDate && endDate
        ? {
            created_at: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : {};

    const result = await PaymentTransaction.findAndCountAll({
      where: {
        ...whereClause,
        ...dateCondition,
        status_transaction: "COMPLETED",
        payment_using: "VIRTUAL_ACCOUNT",
      },
    });

    if (result.count > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", width: 20, key: "dateTransaction" },
        { header: "Transaction Time", width: 20, key: "timeTransaction" },

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
          dateTransaction: value.created_at
            ? moment(value.created_at).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          timeTransaction: value.created_at
            ? moment(value.created_at).tz("Asia/Jakarta").format("HH:mm:ss")
            : "-",

          trx_id: value.trx_id || "-",
          invoice_number: value.invoice_number || "-",
          virtual_account_name: value.virtual_account_name || "-",
          virtual_account_number: value.virtual_account_number || "-",
          virtual_account_email: value.virtual_account_email || "-",
          payment_using: value.payment_using || "-",
          app_module: value.app_module || "-",

          purchase_type: value.transactionType || "-",
          paid_amount: value.paid_amount || "-",
          status_transaction: value.status_transaction || "-",
        });

        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName = startDate
        ? `History_Payment_${startDate}_to_${endDate}.xlsx`
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

export const exportDataHistoryPointByUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { search = "" } = req.query;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (!id) {
      return errorResponse(res, 400, "Missing id parameter");
    }

    const users = await User.findOne({
      where: { id: id },
      attributes: ["id", "fullname", "email"],
    });

    const dateCondition =
      startDate && endDate
        ? {
            createdAt: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : {};

    const transactions = await TransactionHistoryPayment.findAll({
      where: { user_id: id, ...dateCondition },
      order: [["createdAt", "ASC"]], // Urutkan dari yang paling lama
    });

    const checkins = await HistoryPost.findAll({
      where: { user_id: id, ...dateCondition },
      order: [["createdAt", "ASC"]], // Urutkan dari yang paling lama
    });

    let currentPoint = 0;
    let history = [];

    transactions.forEach((trx) => {
      if (trx.purchase_type === "TOPUP") {
        currentPoint += Number(trx.price);
        history.push({
          date: trx.createdAt,
          description: "Topup Point",
          debit: trx.price, // Debit adalah nilai masuk (point bertambah)
          kredit: "",
          currentPoint: currentPoint,
        });
      } else if (
        trx.purchase_type === "MEMBERSHIP" &&
        trx.transactionType === "POINT"
      ) {
        currentPoint -= Number(trx.price);
        history.push({
          date: trx.createdAt,
          description: `Pembelian membership ${trx.product_name} dengan Point`,
          debit: "",
          kredit: trx.price, // Kredit adalah nilai keluar (point berkurang)
          currentPoint: currentPoint,
        });
      }
    });

    checkins.forEach((checkin) => {
      currentPoint -= Number(checkin.tariff);
      history.push({
        date: checkin.createdAt,
        description: `Parking ${checkin.status_member} di ${checkin.location_name}`,
        debit: "",
        kredit: checkin.tariff,
        currentPoint: currentPoint,
      });
    });

    // Filter berdasarkan search query jika ada
    if (search) {
      history = history.filter((item) =>
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (history.length > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", key: "dateTransaction", width: 20 },
        { header: "Transaction Time", key: "timeTransaction", width: 20 },
        { header: "Description", key: "description", width: 40 },
        { header: "Debit", key: "debit", width: 20 },
        { header: "Kredit", key: "kredit", width: 35 },
        { header: "Balance Point", key: "balance_point", width: 30 },
      ];

      // Styling header
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "0070C0" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Isi data ke dalam Excel
      for (const [index, value] of history.entries()) {
        const row = worksheet.addRow({
          No: index + 1,
          dateTransaction: value.date
            ? moment(value.date).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          timeTransaction: value.date
            ? moment(value.date).tz("Asia/Jakarta").format("HH:mm:ss")
            : "-",
          description: value.description || "-",
          debit: value.debit || "-",
          kredit: value.kredit || "-",
          balance_point: value.currentPoint || "-",
        });

        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName = startDate
        ? `History_point_${startDate}_to_${endDate}.xlsx`
        : `History_point_alldate.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Get data failed" });
    }
  } catch (e) {
    return errorResponse(res, 500, e.message);
  }
};

export const exportHistoryPaymentByUser = async (req, res) => {
  const id = req.userId;
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    if (id) {
      whereClause.user_id = id;
    }

    const dateCondition =
      startDate && endDate
        ? {
            createdAt: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : {};

    const result = await TransactionHistoryPayment.findAndCountAll({
      where: {
        ...whereClause,
        ...dateCondition,
      },
    });

    if (result.count > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", width: 20, key: "dateTransaction" },
        { header: "Transaction Time", width: 20, key: "timeTransaction" },
        { header: "Transaction Code", width: 20, key: "trxId" },
        { header: "Location", width: 35, key: "location_name" },
        { header: "Type Transaction", width: 35, key: "purchase_type" },
        { header: "Periode", width: 35, key: "periode" },

        {
          header: "Virtual Account",
          width: 35,
          key: "virtual_account",
        },
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
          dateTransaction: value.createdAt
            ? moment(value.createdAt).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          timeTransaction: value.createdAt
            ? moment(value.createdAt).tz("Asia/Jakarta").format("HH:mm:ss")
            : "-",
          trxId: value.trxId || "-",
          virtual_account: value.virtual_account || "-",
          location_name: value.location_name || "-",
          purchase_type: value.purchase_type || "-",
          periode: value.periode || "-",
        });

        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName = startDate
        ? `History_Payment_${startDate}_to_${endDate}.xlsx`
        : `History_Payment_alldate.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (result.count === 0) {
      res.status(402).json({ success: false, message: "No Data Found" });
    } else {
      res.status(402).json({ success: false, message: "Get data failed" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const exportDataTransaksiPostById = async (req, res) => {
  const id = req.userId;
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const statusMember = req.query.statusMember;

  try {
    const whereClause = {};

    if (locationCode.length > 0) {
      whereClause.location_code = { [Op.in]: locationCode };
    }

    if (id) {
      whereClause.user_id = id;
    }

    const dateCondition =
      startDate && endDate
        ? {
            createdAt: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : null;

    if (statusMember) {
      whereClause.status_member = statusMember;
    }

    const result = await HistoryPost.findAndCountAll({
      where: {
        ...whereClause,
        ...(dateCondition ? dateCondition : {}),
      },
      include: [
        {
          model: User,
          as: "userHistoryPost",
          attributes: ["fullname", "email"],
        },
      ],
    });

    if (result.count > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Location Code", width: 20, key: "location_code" },
        { header: "Location Name", width: 35, key: "location_name" },
        { header: "Customer Name", width: 35, key: "username" },
        { header: "Plate Number", width: 20, key: "plate_number" },
        { header: "Status Membership", width: 20, key: "status_membership" },
        { header: "In Time", width: 30, key: "in_time" },
        { header: "Out TIme", width: 30, key: "out_time" },
        { header: "Tariff", width: 20, key: "tariff" },
        { header: "Status", width: 20, key: "status" },
      ];

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      });

      for (const [index, value] of result.rows.entries()) {
        const row = worksheet.addRow({
          No: index + 1,
          location_code: value.location_code || "-",
          location_name: value.location_name || "-",
          username: value.userHistoryPost
            ? value.userHistoryPost?.fullname
            : "-",
          plate_number: value.plate_number || "-",
          status_membership: value.status_member || "-",
          in_time: value.gate_in_time
            ? moment(value.gate_in_time)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          out_time: value.gate_out_time
            ? moment(value.gate_out_time)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          tariff: value.tariff || "-",
          status: value.is_close === 1 ? "Out Area Parking" : "In Area Parking",
        });

        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName = startDate
        ? `History_post_${startDate}_to_${endDate}.xlsx`
        : `history_post_alldate.xlsx`;

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

export const exportHistoryPoint = async (req, res) => {
  // const locationCode = req.query.locationCode
  //   ? JSON.parse(req.query.locationCode)
  //   : [];
  // const startDate = req.query.startDate;
  // const endDate = req.query.endDate;
  // const type = req.query.type;

  try {
    const allMembershipDetails = await MembershipDetail.findAll({
      attributes: ["Cust_Member", "start_date", "end_date"],
      raw: true,
    });
    const membershipMap = {};
    allMembershipDetails.forEach((md) => {
      membershipMap[md.Cust_Member] = {
        start_date: md.start_date,
        end_date: md.end_date,
      };
    });

    // 1. Ambil semua transaksi PAID dengan relasi user
    const allTransactions = await TransactionHistoryPayment.findAll({
      where: {
        statusPayment: "PAID",
      },
      include: [
        {
          model: User,
          as: "trxHistoryUser",
          attributes: ["id", "username", "email"],
        },
      ],

      raw: true,
    });

    // 2. Kelompokkan berdasarkan user_id
    const groupedByUser = {};
    for (const trx of allTransactions) {
      const userId = trx["trxHistoryUser.id"];
      const username = trx["trxHistoryUser.username"];
      const email = trx["trxHistoryUser.email"];
      const price = parseInt(trx.price);

      if (!groupedByUser[userId]) {
        const memberDetail = membershipMap[userId] || {};
        groupedByUser[userId] = {
          user_id: userId,
          user_name: username,
          email,
          total_point: 0,
          purchase_member: 0,
          start: memberDetail.start_date || null,
          end: memberDetail.end_date || null,
          sisa_point: 0,
          last_topup_date: null,
          last_purchase_date: null,
        };
      }

      if (trx.purchase_type === "TOPUP") {
        groupedByUser[userId].total_point += price;
        const topupDate = new Date(trx.timestamp);
        if (
          !groupedByUser[userId].last_topup_date ||
          topupDate > new Date(groupedByUser[userId].last_topup_date)
        ) {
          groupedByUser[userId].last_topup_date = topupDate;
        }
      }

      if (
        trx.purchase_type === "MEMBERSHIP" &&
        trx.transactionType === "POINT"
      ) {
        groupedByUser[userId].purchase_member += price;
        const purchaseDate = new Date(trx.timestamp);
        if (
          !groupedByUser[userId].last_purchase_date ||
          purchaseDate > new Date(groupedByUser[userId].last_purchase_date)
        ) {
          groupedByUser[userId].last_purchase_date = purchaseDate;
        }
      }
    }

    // 3. Hitung sisa poin dan filter user yang punya topup
    const fullResult = Object.values(groupedByUser)
      .map((item) => {
        item.sisa_point = item.total_point - item.purchase_member;
        return item;
      })
      .filter((item) => item.total_point > 0); // hanya user yang pernah topup

    // Urutkan berdasarkan last_purchase_date (terbaru di atas)
    fullResult.sort((a, b) => {
      const dateA = new Date(a.last_purchase_date || 0);
      const dateB = new Date(b.last_purchase_date || 0);
      return dateB - dateA;
    });

    if (fullResult.length > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Membership");

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "User Name", width: 20, key: "userName" },
        { header: "Email", width: 40, key: "email" },
        { header: "Total Point", width: 15, key: "total_point" },
        { header: "Price Member", width: 15, key: "price_member" },
        { header: "Remaining Point", width: 15, key: "remaining" },
        { header: "Start Date", width: 20, key: "startDate" },
        { header: "End Date", width: 20, key: "endDate" },
        { header: "Last Topup", width: 20, key: "last_topup" },
        { header: "Purchase Date", width: 20, key: "purchase_date" },
      ];

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      });

      for (const [index, value] of fullResult.entries()) {
        const row = worksheet.addRow({
          No: index + 1,
          userName: value.user_name || "-",
          email: value.email || "-",
          total_point: value.total_point,
          price_member: value.purchase_member,
          remaining: value.sisa_point,
          startDate: value.start
            ? moment(value.start).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          endDate: value.end
            ? moment(value.end).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          last_topup: value.last_topup_date
            ? moment(value.last_topup_date)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
          purchase_date: value.last_purchase_date
            ? moment(value.last_purchase_date)
                .tz("Asia/Jakarta")
                .format("YYYY-MM-DD HH:mm:ss")
            : "-",
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

      const fileName = `History_point_alldate.xlsx`;
      // const fileName = startDate
      //   ? `History_transaction_${startDate}_to_${endDate}.xlsx`
      //   : `History_transaction_alldate.xlsx`;

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
