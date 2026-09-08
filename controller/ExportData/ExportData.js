import ExcelJs from "exceljs";
import moment from "moment/moment.js";
import { col, fn, Op, Sequelize, where } from "sequelize";
import { errorResponse } from "../../config/response.js";
import User from "../../model/Members/Users.js";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import MutasiBank from "../../model/Members/v02/MutasiBank.js";
import PaymentTransaction from "../../model/Members/v02/PaymentHistory.js";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";

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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
  try {
    const locationCode = req.query.locationCode
      ? JSON.parse(req.query.locationCode)
      : [];

    const { month, year, search } = req.query;

    // ============================================================
    // DATE FILTER
    // ============================================================

    const currentDate = moment.tz("Asia/Jakarta");

    const selectedMonth = month ? parseInt(month, 10) : currentDate.month() + 1;

    const selectedYear = year ? parseInt(year, 10) : currentDate.year();

    if (
      Number.isNaN(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    if (Number.isNaN(selectedYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    const startDate = moment
      .tz(
        {
          year: selectedYear,
          month: selectedMonth - 1,
          day: 1,
        },
        "Asia/Jakarta",
      )
      .startOf("day");

    const nextMonth = startDate.clone().add(1, "month").startOf("month");

    const endDate = nextMonth.clone().subtract(1, "millisecond");

    console.log("========================================");
    console.log("EXPORT HISTORY TRANSACTION");
    console.log("========================================");
    console.log("month:", month);
    console.log("year:", year);
    console.log("selectedMonth:", selectedMonth);
    console.log("selectedYear:", selectedYear);
    console.log("startDate:", startDate.format("YYYY-MM-DD HH:mm:ss Z"));
    console.log("nextMonth:", nextMonth.format("YYYY-MM-DD HH:mm:ss Z"));
    console.log("endDate:", endDate.format("YYYY-MM-DD HH:mm:ss Z"));
    console.log("locationCode:", locationCode);
    console.log("search:", search);

    // ============================================================
    // WHERE CONDITION
    // ============================================================

    const whereCondition = {
      purchase_type: "MEMBERSHIP",
      statusPayment: "PAID",
      updatedAt: {
        [Op.gte]: startDate.toDate(),
        [Op.lt]: nextMonth.toDate(),
      },
    };

    // ============================================================
    // FILTER LOCATION
    // ============================================================

    if (locationCode.length > 0) {
      whereCondition.location_code = {
        [Op.in]: locationCode,
      };
    }

    // ============================================================
    // FILTER SEARCH
    // ============================================================

    if (search) {
      whereCondition[Op.or] = [
        {
          location_name: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          "$trxHistoryUser.fullname$": {
            [Op.like]: `%${search}%`,
          },
        },
      ];
    }

    // ============================================================
    // GET DATA
    // ============================================================

    const response = await TransactionHistoryPayment.findAll({
      where: whereCondition,

      attributes: [
        ["id", "trx_history_id"],
        "trxId",
        "location_code",
        "location_name",
        "vehicle_type",
        "virtual_account",
        "transactionType",
        "rfid",
        "updatedAt",
        "price",
        "product_name",
        "statusPayment",
      ],

      include: [
        {
          model: PaymentTransaction,
          as: "payment_trx",
          attributes: ["module_name"],
        },
        {
          model: User,
          as: "trxHistoryUser",

          attributes: [
            ["id", "user_id"],
            "fullname",
            "email",
            "points",
            "username",
          ],

          include: [
            {
              model: VehicleList,

              attributes: [
                ["id", "vehicle_id"],
                "rfid",
                "vehicle_type",
                "plate_number",
                "member_customer_no",
              ],

              include: [
                {
                  model: MembershipDetail,
                  as: "membershipDetail",

                  attributes: [
                    ["id", "membership_detail_id"],
                    "updated_at",
                    "end_date",
                  ],
                },
              ],
            },
          ],
        },
      ],

      order: [["updatedAt", "DESC"]],
    });

    // ============================================================
    // DEBUG RESPONSE
    // ============================================================

    console.log("========================================");
    console.log("TOTAL DATA:", response.length);
    console.log("========================================");

    if (response.length > 0) {
      const firstData = response[0];

      console.dir(
        {
          trxId: firstData.trxId,
          user: firstData.trxHistoryUser?.toJSON?.(),
          customerMemberships:
            firstData.trxHistoryUser?.customer_memberships?.map((vehicle) => ({
              vehicle_id: vehicle.vehicle_id,
              rfid: vehicle.rfid,
              vehicle_type: vehicle.vehicle_type,
              plate_number: vehicle.plate_number,
              member_customer_no: vehicle.member_customer_no,
              membershipDetail: vehicle.membershipDetail?.toJSON?.(),
            })),
        },
        {
          depth: null,
        },
      );
    }

    // ============================================================
    // NO DATA
    // ============================================================

    if (response.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }

    // ============================================================
    // WORKBOOK
    // ============================================================

    const workbook = new ExcelJs.Workbook();

    // ============================================================
    // SHEET 1 - TRANSACTION
    // ============================================================

    const transactionWorksheet = workbook.addWorksheet(
      `Transaction ${startDate.format("MM")}-${startDate.format("YYYY")}`,
    );

    transactionWorksheet.columns = [
      {
        header: "No",
        key: "No",
        width: 5,
      },
      {
        header: "Transaction Date",
        key: "dateTransaction",
        width: 20,
      },
      {
        header: "Transaction Time",
        key: "timeTransaction",
        width: 20,
      },
      {
        header: "Transaction Code",
        key: "trxId",
        width: 30,
      },
      {
        header: "Transaction Type",
        key: "transactionType",
        width: 30,
      },
      {
        header: "Virtual Account",
        key: "noVirtualAccount",
        width: 20,
      },
      {
        header: "Account Name",
        key: "AccountName",
        width: 20,
      },
      {
        header: "Location",
        key: "locationName",
        width: 35,
      },
      {
        header: "Bank",
        key: "bank",
        width: 15,
      },
      {
        header: "Product Name",
        key: "typePurchase",
        width: 20,
      },
      {
        header: "Price",
        key: "amount",
        width: 15,
      },
      {
        header: "Fee Admin",
        key: "feeAdmin",
        width: 15,
      },
      {
        header: "Vehicle Type",
        key: "vehicle_type",
        width: 15,
      },
      {
        header: "Start Date",
        key: "start_date",
        width: 15,
      },
      {
        header: "End Date",
        key: "end_date",
        width: 15,
      },
      {
        header: "Plate Number",
        key: "plate_number",
        width: 15,
      },
      {
        header: "No RFID",
        key: "rfid",
        width: 15,
      },
    ];

    // ============================================================
    // TRANSACTION HEADER STYLE
    // ============================================================

    transactionWorksheet.getRow(1).eachCell((cell) => {
      cell.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "0070C0",
        },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });

    transactionWorksheet.getRow(1).height = 25;

    // ============================================================
    // TRANSACTION DATA
    // ============================================================

    let totalPrice = 0;
    let totalFeeAdmin = 0;

    response.forEach((value, index) => {
      const price = Number(value.price) || 0;
      const feeAdmin = 5000;

      const bank =
        value.payment_trx?.module_name === "BAYARIND_BCA_VIRTUAL_ACCOUNT"
          ? "BCA"
          : "NOBU";

      const user = value.trxHistoryUser;

      // ==========================================================
      // CUSTOMER MEMBERSHIP
      // ==========================================================

      const customerMemberships = user?.customer_memberships ?? [];

      // Ambil kendaraan pertama
      const vehicle = customerMemberships[0];

      // membershipDetail adalah OBJECT
      const membershipDetail = vehicle?.membershipDetail;

      console.log("========================================");
      console.log("TRANSACTION:", value.trxId);
      console.log("PLATE:", vehicle?.plate_number);
      console.log("RFID:", vehicle?.rfid);
      console.log("MEMBER CUSTOMER NO:", vehicle?.member_customer_no);
      console.log("MEMBERSHIP DETAIL:", membershipDetail?.toJSON?.());
      console.log("========================================");

      transactionWorksheet.addRow({
        No: index + 1,

        dateTransaction: value.updatedAt
          ? moment(value.updatedAt).tz("Asia/Jakarta").format("YYYY-MM-DD")
          : "-",

        timeTransaction: value.updatedAt
          ? moment(value.updatedAt).tz("Asia/Jakarta").format("HH:mm:ss")
          : "-",

        trxId: value.trxId || "-",

        transactionType: value.transactionType || "-",

        noVirtualAccount: value.virtual_account || "-",

        AccountName: user?.username || user?.fullname || "-",

        locationName: value.location_name || "-",

        bank,

        typePurchase: value.product_name || "-",

        amount: price,

        feeAdmin,

        vehicle_type: vehicle?.vehicle_type || value.vehicle_type || "-",

        start_date: membershipDetail?.updated_at
          ? moment(membershipDetail.updated_at)
              .tz("Asia/Jakarta")
              .format("YYYY-MM-DD")
          : "-",

        end_date: membershipDetail?.end_date
          ? moment(membershipDetail.end_date)
              .tz("Asia/Jakarta")
              .format("YYYY-MM-DD")
          : "-",

        plate_number: vehicle?.plate_number || "-",

        rfid: vehicle?.rfid || value.rfid || "-",
      });

      totalPrice += price;
      totalFeeAdmin += feeAdmin;
    });

    // ============================================================
    // TRANSACTION TOTAL
    // ============================================================

    const totalRow = transactionWorksheet.addRow({
      No: "",
      dateTransaction: "",
      timeTransaction: "",
      trxId: "",
      transactionType: "",
      noVirtualAccount: "",
      AccountName: "",
      locationName: "",
      bank: "",
      typePurchase: "TOTAL",
      amount: totalPrice,
      feeAdmin: totalFeeAdmin,
      vehicle_type: "",
      start_date: "",
      end_date: "",
      plate_number: "",
      rfid: "",
    });

    totalRow.font = {
      bold: true,
    };

    totalRow.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });

    // ============================================================
    // NUMBER FORMAT
    // ============================================================

    transactionWorksheet.getColumn("amount").numFmt = "#,##0";

    transactionWorksheet.getColumn("feeAdmin").numFmt = "#,##0";

    // ============================================================
    // FREEZE HEADER
    // ============================================================

    transactionWorksheet.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    // ============================================================
    // AUTO FILTER
    // ============================================================

    transactionWorksheet.autoFilter = {
      from: "A1",
      to: "Q1",
    };

    // ============================================================
    // SUMMARY DATA
    // ============================================================

    const locationSummary = {};
    const productSummary = {};
    const vehicleSummary = {};

    response.forEach((value) => {
      const location = value.location_name || "-";

      const product = value.product_name || "-";

      const vehicleType = value.vehicle_type || "-";

      const price = Number(value.price) || 0;

      const feeAdmin = 5000;

      // ==========================================================
      // LOCATION
      // ==========================================================

      if (!locationSummary[location]) {
        locationSummary[location] = {
          transaction: 0,
          price: 0,
          feeAdmin: 0,
        };
      }

      locationSummary[location].transaction += 1;
      locationSummary[location].price += price;
      locationSummary[location].feeAdmin += feeAdmin;

      // ==========================================================
      // PRODUCT
      // ==========================================================

      if (!productSummary[product]) {
        productSummary[product] = {
          transaction: 0,
          price: 0,
          feeAdmin: 0,
        };
      }

      productSummary[product].transaction += 1;
      productSummary[product].price += price;
      productSummary[product].feeAdmin += feeAdmin;

      // ==========================================================
      // VEHICLE
      // ==========================================================

      if (!vehicleSummary[vehicleType]) {
        vehicleSummary[vehicleType] = {
          transaction: 0,
          price: 0,
          feeAdmin: 0,
        };
      }

      vehicleSummary[vehicleType].transaction += 1;
      vehicleSummary[vehicleType].price += price;
      vehicleSummary[vehicleType].feeAdmin += feeAdmin;
    });

    // ============================================================
    // SHEET 2 - SUMMARY
    // ============================================================

    const summaryWorksheet = workbook.addWorksheet("Summary");

    // ============================================================
    // COLUMN WIDTH
    // ============================================================

    summaryWorksheet.getColumn(1).width = 8;
    summaryWorksheet.getColumn(2).width = 35;
    summaryWorksheet.getColumn(3).width = 22;
    summaryWorksheet.getColumn(4).width = 20;
    summaryWorksheet.getColumn(5).width = 20;
    summaryWorksheet.getColumn(6).width = 20;
    summaryWorksheet.getColumn(7).width = 20;
    summaryWorksheet.getColumn(8).width = 20;

    // ============================================================
    // SUMMARY TITLE
    // ============================================================

    summaryWorksheet.mergeCells("A1:H1");

    summaryWorksheet.getCell("A1").value = "MEMBERSHIP TRANSACTION SUMMARY";

    summaryWorksheet.getCell("A1").font = {
      bold: true,
      size: 16,
    };

    summaryWorksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    summaryWorksheet.getRow(1).height = 30;

    // ============================================================
    // PERIOD
    // ============================================================

    summaryWorksheet.mergeCells("A2:H2");

    summaryWorksheet.getCell("A2").value = `Period: ${startDate.format(
      "DD MMMM YYYY",
    )} - ${endDate.format("DD MMMM YYYY")}`;

    summaryWorksheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // ============================================================
    // LOCATION FILTER INFO
    // ============================================================

    summaryWorksheet.mergeCells("A3:H3");

    summaryWorksheet.getCell("A3").value =
      locationCode.length > 0
        ? `Location Filter: ${locationCode.join(", ")}`
        : "Location Filter: All Locations";

    summaryWorksheet.getCell("A3").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // ============================================================
    // OVERALL SUMMARY
    // ============================================================

    summaryWorksheet.mergeCells("A5:H5");

    summaryWorksheet.getCell("A5").value = "OVERALL SUMMARY";

    summaryWorksheet.getCell("A5").font = {
      bold: true,
      size: 12,
    };

    summaryWorksheet.getRow(6).values = ["Metric", "Value"];

    summaryWorksheet.getRow(6).font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };

    summaryWorksheet.getRow(6).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "0070C0",
      },
    };

    summaryWorksheet.getRow(7).values = ["Total Transaction", response.length];

    summaryWorksheet.getRow(8).values = ["Total Price", totalPrice];

    summaryWorksheet.getRow(9).values = ["Total Fee Admin", totalFeeAdmin];

    summaryWorksheet.getRow(10).values = [
      "Grand Total",
      totalPrice + totalFeeAdmin,
    ];

    summaryWorksheet.getRow(10).font = {
      bold: true,
    };

    summaryWorksheet.getCell("B8").numFmt = "#,##0";

    summaryWorksheet.getCell("B9").numFmt = "#,##0";

    summaryWorksheet.getCell("B10").numFmt = "#,##0";

    // ============================================================
    // SUMMARY BY LOCATION
    // ============================================================

    let rowIndex = 13;

    summaryWorksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);

    summaryWorksheet.getCell(`A${rowIndex}`).value = "SUMMARY BY LOCATION";

    summaryWorksheet.getCell(`A${rowIndex}`).font = {
      bold: true,
      size: 12,
    };

    rowIndex++;

    summaryWorksheet.getRow(rowIndex).values = [
      "No",
      "Location",
      "Total Transaction",
      "Total Price",
      "Fee Admin",
      "Grand Total",
    ];

    summaryWorksheet.getRow(rowIndex).font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };

    summaryWorksheet.getRow(rowIndex).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "0070C0",
      },
    };

    rowIndex++;

    let locationTotalTransaction = 0;
    let locationTotalPrice = 0;
    let locationTotalFeeAdmin = 0;

    Object.entries(locationSummary).forEach(([location, data], index) => {
      const grandTotal = data.price + data.feeAdmin;

      summaryWorksheet.getRow(rowIndex).values = [
        index + 1,
        location,
        data.transaction,
        data.price,
        data.feeAdmin,
        grandTotal,
      ];

      locationTotalTransaction += data.transaction;

      locationTotalPrice += data.price;

      locationTotalFeeAdmin += data.feeAdmin;

      rowIndex++;
    });

    summaryWorksheet.getRow(rowIndex).values = [
      "",
      "TOTAL",
      locationTotalTransaction,
      locationTotalPrice,
      locationTotalFeeAdmin,
      locationTotalPrice + locationTotalFeeAdmin,
    ];

    summaryWorksheet.getRow(rowIndex).font = {
      bold: true,
    };

    rowIndex += 3;

    // ============================================================
    // SUMMARY BY PRODUCT
    // ============================================================

    summaryWorksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);

    summaryWorksheet.getCell(`A${rowIndex}`).value = "SUMMARY BY PRODUCT";

    summaryWorksheet.getCell(`A${rowIndex}`).font = {
      bold: true,
      size: 12,
    };

    rowIndex++;

    summaryWorksheet.getRow(rowIndex).values = [
      "No",
      "Product Name",
      "Total Transaction",
      "Total Price",
      "Fee Admin",
      "Grand Total",
    ];

    summaryWorksheet.getRow(rowIndex).font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };

    summaryWorksheet.getRow(rowIndex).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "0070C0",
      },
    };

    rowIndex++;

    let productTotalTransaction = 0;
    let productTotalPrice = 0;
    let productTotalFeeAdmin = 0;

    Object.entries(productSummary).forEach(([product, data], index) => {
      const grandTotal = data.price + data.feeAdmin;

      summaryWorksheet.getRow(rowIndex).values = [
        index + 1,
        product,
        data.transaction,
        data.price,
        data.feeAdmin,
        grandTotal,
      ];

      productTotalTransaction += data.transaction;

      productTotalPrice += data.price;

      productTotalFeeAdmin += data.feeAdmin;

      rowIndex++;
    });

    summaryWorksheet.getRow(rowIndex).values = [
      "",
      "TOTAL",
      productTotalTransaction,
      productTotalPrice,
      productTotalFeeAdmin,
      productTotalPrice + productTotalFeeAdmin,
    ];

    summaryWorksheet.getRow(rowIndex).font = {
      bold: true,
    };

    rowIndex += 3;

    // ============================================================
    // SUMMARY BY VEHICLE TYPE
    // ============================================================

    summaryWorksheet.mergeCells(`A${rowIndex}:H${rowIndex}`);

    summaryWorksheet.getCell(`A${rowIndex}`).value = "SUMMARY BY VEHICLE TYPE";

    summaryWorksheet.getCell(`A${rowIndex}`).font = {
      bold: true,
      size: 12,
    };

    rowIndex++;

    summaryWorksheet.getRow(rowIndex).values = [
      "No",
      "Vehicle Type",
      "Total Transaction",
      "Total Price",
      "Fee Admin",
      "Grand Total",
    ];

    summaryWorksheet.getRow(rowIndex).font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };

    summaryWorksheet.getRow(rowIndex).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "0070C0",
      },
    };

    rowIndex++;

    let vehicleTotalTransaction = 0;
    let vehicleTotalPrice = 0;
    let vehicleTotalFeeAdmin = 0;

    Object.entries(vehicleSummary).forEach(([vehicleType, data], index) => {
      const grandTotal = data.price + data.feeAdmin;

      summaryWorksheet.getRow(rowIndex).values = [
        index + 1,
        vehicleType,
        data.transaction,
        data.price,
        data.feeAdmin,
        grandTotal,
      ];

      vehicleTotalTransaction += data.transaction;

      vehicleTotalPrice += data.price;

      vehicleTotalFeeAdmin += data.feeAdmin;

      rowIndex++;
    });

    summaryWorksheet.getRow(rowIndex).values = [
      "",
      "TOTAL",
      vehicleTotalTransaction,
      vehicleTotalPrice,
      vehicleTotalFeeAdmin,
      vehicleTotalPrice + vehicleTotalFeeAdmin,
    ];

    summaryWorksheet.getRow(rowIndex).font = {
      bold: true,
    };

    // ============================================================
    // SUMMARY FORMAT
    // ============================================================

    summaryWorksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });
    });

    summaryWorksheet.getColumn(4).numFmt = "#,##0";

    summaryWorksheet.getColumn(5).numFmt = "#,##0";

    summaryWorksheet.getColumn(6).numFmt = "#,##0";

    // ============================================================
    // FREEZE SUMMARY
    // ============================================================

    summaryWorksheet.views = [
      {
        state: "frozen",
        ySplit: 6,
      },
    ];

    // ============================================================
    // FILE NAME
    // ============================================================

    const locationName =
      locationCode.length === 1
        ? response[0]?.location_name || "ALL"
        : "ALL_LOCATION";

    const safeLocationName = locationName
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_");

    const fileName =
      `Transaction_${safeLocationName}_` +
      `${startDate.format("YYYYMMDD")}_` +
      `${endDate.format("YYYYMMDD")}.xlsx`;

    // ============================================================
    // RESPONSE
    // ============================================================

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error("Export History Transaction Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const exportHistoryPayment = async (req, res) => {
  const locationCode = req.query.locationCode
    ? JSON.parse(req.query.locationCode)
    : [];
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  console.log("=== EXPORT PAYMENT ===");
  console.log("startDate:", startDate);
  console.log("endDate:", endDate);
  console.log("query:", req.query);

  try {
    const whereClause = {
      status_transaction: "COMPLETED",
      payment_using: "VIRTUAL_ACCOUNT",
      app_module: "APP_MEMBERSHIP",
    };

    if (locationCode.length > 0) {
      whereClause.location_code = {
        [Op.in]: locationCode,
      };
    }

    if (startDate && endDate) {
      const start = moment.tz(startDate, "YYYY-MM-DD", "Asia/Jakarta");

      const end = moment
        .tz(endDate, "YYYY-MM-DD", "Asia/Jakarta")
        .add(1, "day");

      whereClause.created_at = {
        [Op.gte]: start.toDate(),
        [Op.lt]: end.toDate(),
      };
    }

    const result = await PaymentTransaction.findAndCountAll({
      where: whereClause,
      order: [["created_at", "ASC"]],
    });

    if (result.count === 0) {
      return res.status(400).json({
        success: false,
        message: "Get data failed",
      });
    }

    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Transaction Membership");

    worksheet.columns = [
      { header: "No", key: "No", width: 5 },
      { header: "Transaction Date", key: "dateTransaction", width: 20 },
      { header: "Transaction Time", key: "timeTransaction", width: 20 },
      { header: "Transaction Code", key: "trx_id", width: 30 },
      { header: "Invoice Number", key: "invoice_number", width: 30 },
      {
        header: "Virtual Account Name",
        key: "virtual_account_name",
        width: 35,
      },
      {
        header: "Virtual Account Number",
        key: "virtual_account_number",
        width: 35,
      },
      {
        header: "Virtual Account Email",
        key: "virtual_account_email",
        width: 35,
      },
      { header: "Payment Method", key: "payment_using", width: 30 },
      { header: "Product", key: "app_module", width: 35 },
      { header: "Amount", key: "paid_amount", width: 30 },
      { header: "Status", key: "status_transaction", width: 20 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0070C0" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });

    for (const [index, value] of result.rows.entries()) {
      const transactionDate = value.created_at
        ? moment(value.created_at).tz("Asia/Jakarta")
        : null;

      const row = worksheet.addRow({
        No: index + 1,
        dateTransaction: transactionDate
          ? transactionDate.format("YYYY-MM-DD")
          : "-",
        timeTransaction: transactionDate
          ? transactionDate.format("HH:mm:ss")
          : "-",
        trx_id: value.trx_id || "-",
        invoice_number: value.invoice_number || "-",
        virtual_account_name: value.virtual_account_name || "-",
        virtual_account_number: value.virtual_account_number || "-",
        virtual_account_email: value.virtual_account_email || "-",
        payment_using: value.payment_using || "-",
        app_module: value.app_module || "-",
        paid_amount: value.paid_amount || "-",
        status_transaction: value.status_transaction || "-",
      });

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });
    }

    const fileName =
      startDate && endDate
        ? `History_Payment_${startDate}_to_${endDate}.xlsx`
        : "History_Payment_alldate.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const exportHistoryPaymentB2B = async (req, res) => {
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
            updated_at: {
              [Sequelize.Op.gte]: `${startDate} 00:00:00`,
              [Sequelize.Op.lt]: `${endDate} 23:59:59`,
            },
          }
        : {};

    // Ambil data dengan urutan terbaru (DESC) agar jika ada duplikat, yang terbaru yang diambil
    const result = await PaymentTransaction.findAndCountAll({
      where: {
        ...whereClause,
        ...dateCondition,
        status_transaction: "COMPLETED",
        payment_using: "VIRTUAL_ACCOUNT",
        app_module: "APP_MEMBERSHIP_B2B",
      },
      order: [["updated_at", "DESC"]],
    });

    if (result.count > 0) {
      // --- LOGIC: FILTER UNIQUE INVOICE ---
      const uniqueRows = [];
      const seenInvoices = new Set();

      for (const row of result.rows) {
        // Jika invoice_number belum pernah muncul, masukkan ke array
        if (!seenInvoices.has(row.invoice_number)) {
          seenInvoices.add(row.invoice_number);
          uniqueRows.push(row);
        }
      }
      // ------------------------------------

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

      // Styling Header
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "0070C0" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Menggunakan data yang sudah difilter (uniqueRows)
      for (const [index, value] of uniqueRows.entries()) {
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res
        .status(404)
        .json({ success: false, message: "No data found to export" });
    }
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
        item.description.toLowerCase().includes(search.toLowerCase()),
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

export const exportDetailMutationBank = async (req, res) => {
  try {
    const { date, bankName } = req.query;
    console.log(date, bankName);
    if (!date) {
      return res.status(400).json({ message: "month (YYYY-MM-dd) required" });
    }

    const whereClause = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn(
            "DATE",
            Sequelize.fn(
              "CONVERT_TZ",
              Sequelize.col("trxDate"),
              "+00:00",
              "+07:00",
            ), // UTC -> WIB
          ),
          date,
        ),
      ],
    };

    // kalau ada filter bankName
    if (bankName) {
      whereClause[Op.and].push({ bankName });
    }

    const result = await MutasiBank.findAndCountAll({ where: whereClause });

    const bank_name =
      bankName === "BAYARIND_BCA_VIRTUAL_ACCOUNT" ? "Bayarind BCA" : "NOBU";

    if (result.count > 0) {
      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet(`Transaction ${bank_name}`);

      worksheet.columns = [
        { header: "No", key: "No", width: 5 },
        { header: "Transaction Date", width: 20, key: "dateTransaction" },
        { header: "Transaction No", width: 20, key: "transactionNo" },
        { header: "Virtual Account", width: 20, key: "noVirtualAccount" },
        { header: "Location", width: 35, key: "locationName" },
        { header: "Product Name", width: 20, key: "typePurchase" },
        { header: "Price", width: 15, key: "amount" },
        { header: "Fee Admin", width: 15, key: "feeAdmin" },
        { header: "No RFID", width: 15, key: "rfid" },
        { header: "Vehicle License", width: 15, key: "platNumber" },
        { header: "Start Date", width: 20, key: "startDate" },
        { header: "End Date", width: 20, key: "endDate" },
        { header: "Status", width: 20, key: "status" },
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
          dateTransaction: value.trxDate
            ? moment(value.trxDate).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          transactionNo: value.transactionNo || "-",
          noVirtualAccount: value.noVirtualAcount || "-",
          locationName: value.locationName || "-",
          typePurchase: value.typePurchase || "-",
          amount: value.amount - 5000 || "-",
          feeAdmin: 5000 || "-",
          rfid: value.rfid || "-",
          platNumber: value.platNumber || "-",
          startDate: value.startDate
            ? moment(value.startDate).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          endDate: value.endDate
            ? moment(value.endDate).tz("Asia/Jakarta").format("YYYY-MM-DD")
            : "-",
          status: value.status || "-",
        });

        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }

      const fileName = date
        ? `mutasi_${bank_name}_${date}.xlsx`
        : `mutasi_${bank_name}_alldate.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

export const exportDetailTransaksiLocation = async (req, res) => {
  try {
    const { month, year, search = "" } = req.query;

    const currentDate = new Date();

    // month dari frontend menggunakan 1 - 12
    const selectedMonth = month
      ? parseInt(month, 10)
      : currentDate.getUTCMonth() + 1;

    const selectedYear = year
      ? parseInt(year, 10)
      : currentDate.getUTCFullYear();

    if (
      selectedMonth < 1 ||
      selectedMonth > 12 ||
      Number.isNaN(selectedMonth) ||
      Number.isNaN(selectedYear)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year",
      });
    }

    /**
     * Database menyimpan updatedAt dalam UTC.
     *
     * Kita ingin mengambil transaksi berdasarkan bulan WIB.
     *
     * Contoh:
     * September 2026 WIB
     *
     * start:
     * 2026-08-31 17:00:00 UTC
     *
     * next month:
     * 2026-09-30 17:00:00 UTC
     *
     * Gunakan end exclusive supaya tidak ada masalah millisecond.
     */
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

    const startDate = new Date(
      Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0) - WIB_OFFSET_MS,
    );

    const nextMonth = new Date(
      Date.UTC(selectedYear, selectedMonth, 1, 0, 0, 0, 0) - WIB_OFFSET_MS,
    );

    console.log("Export transaction:");
    console.log("Start:", startDate);
    console.log("Next Month:", nextMonth);

    /**
     * Filter dasar
     */
    const whereCondition = {
      location_code: req.params.locationCode,
      purchase_type: "MEMBERSHIP",
      statusPayment: "PAID",
      updatedAt: {
        [Op.gte]: startDate,
        [Op.lt]: nextMonth,
      },
    };

    /**
     * Search
     *
     * location_name
     * atau
     * username/fullname user
     */
    if (search?.trim()) {
      const keyword = search.trim();

      whereCondition[Op.or] = [
        {
          location_name: {
            [Op.like]: `%${keyword}%`,
          },
        },
        {
          "$trxHistoryUser.fullname$": {
            [Op.like]: `%${keyword}%`,
          },
        },
        {
          "$trxHistoryUser.username$": {
            [Op.like]: `%${keyword}%`,
          },
        },
      ];
    }

    /**
     * Ambil data transaksi
     *
     * Struktur association sekarang:
     *
     * TransactionHistoryPayment
     *   ├── membershipDetail
     *   │     └── vehicles
     *   │
     *   └── trxHistoryUser
     */
    const response = await TransactionHistoryPayment.findAll({
      where: whereCondition,

      attributes: [
        ["id", "trx_history_id"],
        "trxId",
        "location_code",
        "location_name",
        "vehicle_type",
        "virtual_account",
        "transactionType",
        "rfid",
        "updatedAt",
        "price",
        "product_name",
        "statusPayment",
      ],

      include: [
        {
          model: MembershipDetail,
          as: "membershipDetail",
          attributes: [
            ["id", "membership_detail_id"],
            "member_customer_no",
            "updated_at",
            "end_date",
          ],
          include: [
            {
              model: VehicleList,
              as: "vehicles",
              attributes: [
                ["id", "vehicle_id"],
                "rfid",
                "vehicle_type",
                "plate_number",
              ],
            },
          ],
        },

        {
          model: User,
          as: "trxHistoryUser",
          attributes: [
            ["id", "user_id"],
            "fullname",
            "email",
            "points",
            "username",
          ],
        },
      ],

      order: [["updatedAt", "DESC"]],
    });

    /**
     * Tidak ada data
     */
    if (response.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }

    /**
     * Helper untuk memastikan data menjadi TEXT.
     *
     * Penting untuk:
     * - Transaction Code
     * - Virtual Account
     * - RFID
     * - Plate Number
     *
     * Supaya Excel tidak mengubahnya menjadi:
     *
     * 8.99986E+15
     */
    const toText = (value) => {
      if (value === null || value === undefined || value === "") {
        return "-";
      }

      return String(value);
    };

    /**
     * Helper tanggal
     */
    const formatDate = (value) => {
      if (!value) {
        return "-";
      }

      return moment(value).tz("Asia/Jakarta").format("YYYY-MM-DD");
    };

    const formatTime = (value) => {
      if (!value) {
        return "-";
      }

      return moment(value).tz("Asia/Jakarta").format("HH:mm:ss");
    };

    /**
     * Workbook
     */
    const workbook = new ExcelJs.Workbook();

    workbook.creator = "SKY Membership";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(
      `Transaction ${moment(startDate).tz("Asia/Jakarta").format("YYYY-MM-DD")} - ${moment(
        nextMonth,
      )
        .tz("Asia/Jakarta")
        .subtract(1, "day")
        .format("YYYY-MM-DD")}`,
    );

    /**
     * Columns
     */
    worksheet.columns = [
      {
        header: "No",
        key: "No",
        width: 6,
      },
      {
        header: "Transaction Date",
        key: "dateTransaction",
        width: 18,
      },
      {
        header: "Transaction Time",
        key: "timeTransaction",
        width: 16,
      },
      {
        header: "Transaction Code",
        key: "trxId",
        width: 28,
      },
      {
        header: "Transaction Type",
        key: "transactionType",
        width: 22,
      },
      {
        header: "Virtual Account",
        key: "noVirtualAccount",
        width: 22,
      },
      {
        header: "Account Name",
        key: "AccountName",
        width: 25,
      },
      {
        header: "Location",
        key: "locationName",
        width: 35,
      },
      {
        header: "Bank",
        key: "bank",
        width: 12,
      },
      {
        header: "Product Name",
        key: "typePurchase",
        width: 22,
      },
      {
        header: "Price",
        key: "amount",
        width: 16,
      },
      {
        header: "Fee Admin",
        key: "feeAdmin",
        width: 16,
      },
      {
        header: "Vehicle Type",
        key: "vehicle_type",
        width: 16,
      },
      {
        header: "Start Date",
        key: "start_date",
        width: 16,
      },
      {
        header: "End Date",
        key: "end_date",
        width: 16,
      },
      {
        header: "Plate Number",
        key: "plate_number",
        width: 18,
      },
      {
        header: "No RFID",
        key: "rfid",
        width: 22,
      },
    ];

    /**
     * Header style
     */
    const headerRow = worksheet.getRow(1);

    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "0070C0",
        },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      cell.border = {
        top: {
          style: "thin",
          color: {
            argb: "FFFFFFFF",
          },
        },
        bottom: {
          style: "thin",
          color: {
            argb: "FFFFFFFF",
          },
        },
        left: {
          style: "thin",
          color: {
            argb: "FFFFFFFF",
          },
        },
        right: {
          style: "thin",
          color: {
            argb: "FFFFFFFF",
          },
        },
      };
    });

    /**
     * Freeze header
     */
    worksheet.views = [
      {
        state: "frozen",
        ySplit: 1,
      },
    ];

    /**
     * Autofilter
     */
    worksheet.autoFilter = {
      from: "A1",
      to: "Q1",
    };

    let totalPrice = 0;
    let totalFeeAdmin = 0;
    let locationName = "";

    /**
     * Data rows
     */
    response.forEach((value, index) => {
      const price = Number(value.price) || 0;

      const feeAdmin = 5000;

      /**
       * Membership detail
       */
      const membershipDetail = value.membershipDetail;

      /**
       * Karena MembershipDetail.hasMany(VehicleList),
       * hasilnya adalah array:
       *
       * membershipDetail.vehicles
       */
      const vehicles = membershipDetail?.vehicles || [];

      /**
       * Cari kendaraan yang paling cocok.
       *
       * Prioritas:
       *
       * 1. RFID sama
       * 2. Vehicle type sama
       * 3. kendaraan pertama
       */
      const vehicle =
        vehicles.find(
          (item) =>
            value.rfid && item.rfid && String(item.rfid) === String(value.rfid),
        ) ||
        vehicles.find(
          (item) =>
            value.vehicle_type &&
            item.vehicle_type &&
            String(item.vehicle_type).toUpperCase() ===
              String(value.vehicle_type).toUpperCase(),
        ) ||
        vehicles[0];

      const plateNumber = vehicle?.plate_number || "-";

      const vehicleRfid = vehicle?.rfid || value.rfid || "-";

      const vehicleType = vehicle?.vehicle_type || value.vehicle_type || "-";

      const startDateMembership = membershipDetail?.updated_at
        ? formatDate(membershipDetail.updated_at)
        : "-";

      const endDateMembership = membershipDetail?.end_date
        ? formatDate(membershipDetail.end_date)
        : "-";

      const accountName =
        value.trxHistoryUser?.username || value.trxHistoryUser?.fullname || "-";

      /**
       * Bank dari Virtual Account
       */
      let bank = "-";

      const virtualAccount = toText(value.virtual_account);

      if (virtualAccount.startsWith("899986")) {
        bank = "NOBU";
      } else if (virtualAccount.startsWith("384689")) {
        bank = "BCA";
      }

      worksheet.addRow({
        No: index + 1,

        dateTransaction: formatDate(value.updatedAt),

        timeTransaction: formatTime(value.updatedAt),

        /**
         * FORCE TEXT
         */
        trxId: toText(value.trxId),

        transactionType: toText(value.transactionType),

        /**
         * FORCE TEXT
         */
        noVirtualAccount: virtualAccount,

        AccountName: toText(accountName),

        locationName: toText(value.location_name),

        bank,

        typePurchase: toText(value.product_name),

        amount: price,

        feeAdmin,

        vehicle_type: toText(vehicleType),

        start_date: startDateMembership,

        end_date: endDateMembership,

        /**
         * FORCE TEXT
         */
        plate_number: toText(plateNumber),

        /**
         * FORCE TEXT
         */
        rfid: toText(vehicleRfid),
      });

      locationName = value.location_name || "-";

      totalPrice += price;
      totalFeeAdmin += feeAdmin;
    });

    /**
     * Format angka currency
     */
    const dataStartRow = 2;
    const dataEndRow = worksheet.lastRow.number;

    for (let rowNumber = dataStartRow; rowNumber <= dataEndRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      /**
       * Price
       */
      row.getCell("amount").numFmt = "#,##0";

      /**
       * Fee Admin
       */
      row.getCell("feeAdmin").numFmt = "#,##0";

      /**
       * Text columns
       *
       * @ = Text format Excel
       */
      row.getCell("trxId").numFmt = "@";
      row.getCell("noVirtualAccount").numFmt = "@";
      row.getCell("plate_number").numFmt = "@";
      row.getCell("rfid").numFmt = "@";

      row.alignment = {
        vertical: "middle",
      };

      /**
       * Center beberapa kolom
       */
      row.getCell("No").alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      row.getCell("dateTransaction").alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      row.getCell("timeTransaction").alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      row.getCell("transactionType").alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      row.getCell("bank").alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      row.getCell("vehicle_type").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    }

    /**
     * Total row
     */
    const totalRow = worksheet.addRow({
      No: "",
      dateTransaction: "",
      timeTransaction: "",
      trxId: "",
      transactionType: "",
      noVirtualAccount: "",
      AccountName: "",
      locationName: "TOTAL",
      bank: "",
      typePurchase: "",
      amount: totalPrice,
      feeAdmin: totalFeeAdmin,
      vehicle_type: "",
      start_date: "",
      end_date: "",
      plate_number: "",
      rfid: "",
    });

    totalRow.font = {
      bold: true,
    };

    totalRow.height = 24;

    totalRow.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "E2F0D9",
        },
      };
    });

    totalRow.getCell("amount").numFmt = "#,##0";
    totalRow.getCell("feeAdmin").numFmt = "#,##0";

    /**
     * Border seluruh data
     */
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: {
            style: "thin",
            color: {
              argb: "D9D9D9",
            },
          },
          bottom: {
            style: "thin",
            color: {
              argb: "D9D9D9",
            },
          },
          left: {
            style: "thin",
            color: {
              argb: "D9D9D9",
            },
          },
          right: {
            style: "thin",
            color: {
              argb: "D9D9D9",
            },
          },
        };
      });
    });

    /**
     * Nama file
     */
    const safeLocationName = String(locationName || "Location")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_");

    const periodStart = moment(startDate).tz("Asia/Jakarta").format("YYYYMMDD");

    const periodEnd = moment(nextMonth)
      .tz("Asia/Jakarta")
      .subtract(1, "day")
      .format("YYYYMMDD");

    const fileName = `Transaction_${safeLocationName}_${periodStart}_${periodEnd}.xlsx`;

    /**
     * Response
     */
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error("exportDetailTransaksiLocation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const exportExcelByMonth = async (req, res) => {
  try {
    const { month, bankName } = req.query; // format "YYYY-MM"

    if (!month) {
      return res
        .status(400)
        .json({ message: "Parameter month wajib diisi, format YYYY-MM" });
    }

    const [year, bulan] = month.split("-");

    const filters = {
      [Op.and]: [
        where(fn("YEAR", col("trxDate")), year),
        where(fn("MONTH", col("trxDate")), bulan),
      ],
    };

    if (bankName) {
      filters.bankName = bankName;
    }

    // ambil data berdasarkan bulan & tahun dari trxDate
    const records = await MutasiBank.findAll({
      where: filters,
      raw: true,
    });

    // buat workbook Excel
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("Mutasi Bank");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Location", key: "locationName", width: 30 },
      { header: "Bank", key: "bankName", width: 35 },
      { header: "Transaction No", key: "transactionNo", width: 25 },
      { header: "Trx Date", key: "trxDate", width: 15 },
      { header: "Virtual Account", key: "noVirtualAcount", width: 25 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "RFID", key: "rfid", width: 20 },
      { header: "Plat Number", key: "platNumber", width: 15 },
      { header: "Type Purchase", key: "typePurchase", width: 20 },
      { header: "Start Date", key: "startDate", width: 15 },
      { header: "End Date", key: "endDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Transfer Date", key: "transferDate", width: 20 },
    ];

    // isi data ke Excel
    records.forEach((row, index) => {
      const safeRow = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, v ?? "-"]),
      );

      worksheet.addRow({
        no: index + 1,
        ...safeRow,
      });
    });

    // response file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reconcile-${month}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal export Excel" });
  }
};
