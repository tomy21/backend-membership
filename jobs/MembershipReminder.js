// jobs/membershipReminder.js
import cron from "node-cron";

import MembershipDetail from "../model/Members/v02/MembershipDetail.js";
import MembershipNotification from "../model/Members/v02/Notification.js";
import { Op } from "sequelize";
import VehicleList from "../model/Members/v02/VehicleList.js";

const scheduleMembershipReminder = () => {
  cron.schedule("55 01 * * *", async () => {
    console.log("🔔 Running membership reminder...");

    const today = new Date();
    const threeDaysLater = new Date();
    const threeDaysBefore = new Date();
    threeDaysBefore.setDate(today.getDate() - 3);
    threeDaysLater.setDate(today.getDate() + 3);

    try {
      const memberships = await MembershipDetail.findAll({
        where: {
          end_date: {
            [Op.or]: [
              { [Op.between]: [threeDaysBefore, today] }, // sudah lewat 3 hari terakhir
              { [Op.between]: [today, threeDaysLater] }, // akan habis dalam 3 hari
            ],
          },
          is_active: 1,
        },
      });

      if (memberships.length === 0) {
        console.log("ℹ️ Tidak ada membership yang mendekati expired.");
        return;
      }

      const vehicleList = await VehicleList.findAll({
        where: {
          id: {
            [Op.in]: memberships.map((m) => m.Cust_Member),
          },
        },
      });

      for (const member of memberships) {
        const vehicle = vehicleList.find((v) => v.id === member.Cust_Member);

        if (!vehicle) {
          console.warn(
            `⚠️ Kendaraan tidak ditemukan untuk Cust_Member ID: ${member.Cust_Member}`
          );
          continue;
        }

        const daysLeft = Math.ceil(
          (new Date(member.end_date) - today) / (1000 * 60 * 60 * 24)
        );

        let message;
        let title;
        if (daysLeft > 0) {
          title = "Pemberitahuan Membership";
          message = `Membership Anda dengan no RFID ${vehicle.rfid} akan habis dalam ${daysLeft} hari. Silakan perpanjang.`;
        } else if (daysLeft < 0) {
          title = "Membership Expired";
          message = `Membership Anda dengan no RFID ${
            vehicle.rfid
          } sudah expired ${Math.abs(daysLeft)} hari. Silakan perpanjang.`;
        } else if (daysLeft === 0) {
          title = "Membership Expired";
          message = `Membership Anda dengan no RFID ${vehicle.rfid} akan habis hari ini. Silakan perpanjang.`;
        } else {
          title = "Pemberitahuan Membership";
          message = `Membership Anda dengan no RFID ${
            vehicle.rfid
          } telah expired ${Math.abs(
            daysLeft
          )} hari yang lalu. Silakan perpanjang.`;
        }

        await MembershipNotification.create({
          UserId: vehicle.cust_id,
          Title: title,
          Message: message,
          IsRead: false,
          PlateNumber: vehicle.plate_number,
          CustomerNo: member.member_customer_no,
          NoRFID: vehicle.rfid,
        });

        console.log(`📬 Notifikasi dikirim ke ${vehicle.plate_number}`);
      }

      console.log(`✅ ${memberships.length} notifikasi selesai dikirim.`);
    } catch (err) {
      console.error("❌ Gagal menjalankan cron membership:", err);
    }
  });
};

export default scheduleMembershipReminder;
