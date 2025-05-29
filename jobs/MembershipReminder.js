// jobs/membershipReminder.js
import cron from "node-cron";

import MembershipDetail from "../model/Members/v02/MembershipDetail.js";
import MembershipNotification from "../model/Members/v02/Notification.js";
import { Op } from "sequelize";
import VehicleList from "../model/Members/v02/VehicleList.js";

const scheduleMembershipReminder = () => {
  cron.schedule("00 24 * * *", async () => {
    console.log("🔔 Running membership reminder...");

    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    try {
      const memberships = await MembershipDetail.findAll({
        where: {
          end_date: {
            [Op.between]: [today, threeDaysLater],
          },
          is_active: 1,
        },
      });

      const vehicleList = await VehicleList.findAll({
        where: {
          id: {
            [Op.in]: memberships.map((m) => m.Cust_Member),
          },
        },
      });

      console.log(vehicleList);

      for (const member of memberships) {
        const vehicle = vehicleList.find((v) => v.id === member.Cust_Member);

        const daysLeft = Math.ceil(
          (new Date(member.end_date) - today) / (1000 * 60 * 60 * 24)
        );

        const message =
          daysLeft > 0
            ? `Membership Anda dengan no RFID ${vehicle.rfid} akan habis dalam ${daysLeft} hari. Silakan perpanjang.`
            : `Membership Anda dengan no RFID ${vehicle.rfid} telah expired. Silakan perpanjang.`;

        await MembershipNotification.create({
          UserId: vehicle ? vehicle.cust_id : null, // gunakan null kalau tidak ditemukan
          Title: "Pemberitahuan Membership",
          Message: message,
          IsRead: false,
          PlateNumber: vehicle ? vehicle.plate_number : "-", // ambil dari data kendaraan
          CustomerNo: member.member_customer_no,
          NoRFID: vehicle ? vehicle.rfid : null,
        });
      }

      console.log(`✅ ${memberships.length} notifikasi dikirim.`);
    } catch (err) {
      console.error("❌ Gagal menjalankan cron membership:", err);
    }
  });
};

export default scheduleMembershipReminder;
