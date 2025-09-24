import User from "../../model/Members/Users.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import TransactionHistoryPayment from "../../model/Members/v02/TransactionPaymentHistory.js";
import { Op } from "sequelize";

export const historyPointUsed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Ambil semua membership
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

    // 4. Hitung total semua sisa point
    const totalAllSisaPoint = fullResult.reduce(
      (acc, cur) => acc + cur.sisa_point,
      0
    );

    // 5. Paging
    const paginatedResult = fullResult.slice(offset, offset + limit);

    // 6. Kirim hasil
    res.status(200).json({
      success: true,
      total_user: fullResult.length,
      total_all_sisa_point: totalAllSisaPoint,
      pagination: {
        total: fullResult.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(fullResult.length / limit),
      },
      data: paginatedResult,
    });
  } catch (error) {
    console.error("Error historyPointUsed:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
