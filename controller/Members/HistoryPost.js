import { Op, Sequelize } from "sequelize";
import HistoryPost from "../../model/Members/v02/HistoryPost.js";
import User from "../../model/Members/Users.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";
import ExcelJs from "exceljs";
import moment from "moment/moment.js";

export const HistoryPostController = async (req, res) => {
  const id = req.userId;
  const limit = parseInt(req.query.limit) || 10; // Default 10 item per halaman
  const page = parseInt(req.query.page) || 1; // Default halaman pertama
  const offset = (page - 1) * limit;

  try {
    const { count, rows: histories } = await HistoryPost.findAndCountAll({
      where: { user_id: id },
      attributes: [
        [
          Sequelize.literal(`
            CASE 
            WHEN check_in_time IS NOT NULL AND gate_out_time IS NULL THEN 'In area parking'
            WHEN check_in_time IS NOT NULL AND gate_out_time IS NOT NULL THEN 'Out area parking'
            ELSE 'Unknown'
            END
          `),
          "status",
        ],
        "plate_number",
        "location_name",
        "gate_in_time",
        "gate_out_time",
        "tariff",
        "status_member",
        "balance_before",
        "balance_after",
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    if (!histories.length) {
      return res.status(404).json({
        statusCode: 404,
        message: "No history found",
      });
    }

    // Transformasi data untuk membuat dua baris per entri
    const transformedHistories = histories.flatMap((history) => [
      {
        plate_number: history.plate_number,
        location_name: history.location_name,
        time: history.gate_out_time,
        type: "Keluar Area Parkir",
        status_member: history.status_member,
        balance: history.balance_after,
        tariff:
          parseInt(history.balance_before) - parseInt(history.balance_after),
      },
      {
        plate_number: history.plate_number,
        location_name: history.location_name,
        time: history.gate_in_time,
        type: "Masuk Area Parkir",
        status_member: history.status_member,
        balance: history.balance_before,
      },
    ]);

    // Paginasi data hasil transformasi
    const paginatedData = transformedHistories.slice(offset, offset + limit);

    res.status(200).json({
      statusCode: 200,
      message: "Transaction retrieved successfully",
      data: paginatedData,
      totalItems: transformedHistories.length,
      currentPage: page,
      totalPages: Math.ceil(transformedHistories.length / limit),
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};

export const AllTransaction = async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const offset = (page - 1) * limit;
  const status = req.query.status?.trim() || "All";
  const statusMember = req.query.statusMember?.trim() || null;
  const isStatusDefined = status !== undefined && status !== null;
  try {
    const whereCondition = {}; // Inisialisasi objek where

    // Jika status bukan string kosong, tambahkan filter is_close
    if (isStatusDefined && status !== "All") {
      whereCondition.is_close = status;
    }

    if (statusMember === "NON-MEMBER") {
      whereCondition.status_member = statusMember;
      whereCondition.is_close = 1;
    }

    const { count, rows } = await HistoryPost.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "userHistoryPost",
          attributes: ["fullname", "email"],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      total: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
};

export const exportDataTransaksiPost = async (req, res) => {
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

    const dateCondition = date
      ? {
          createdAt: {
            [Sequelize.Op.gte]: `${startDate} 00:00:00`,
            [Sequelize.Op.lt]: `${endDate} 23:59:59`,
          },
        }
      : null;

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

    if (result) {
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

      const fileName =
        locationCode.length > 0 && date ? `${date}.xlsx` : `alldate.xlsx`;

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
