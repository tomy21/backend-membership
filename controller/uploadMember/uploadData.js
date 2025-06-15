import xlsx from "xlsx";
import crypto from "crypto";
import User from "../../model/Members/Users.js";
import upload from "../../middleware/uploadData/uploadExcel.js";
import { sendEmailRegister } from "../../config/EmailService.js";
import MasterCard from "../../model/Members/v02/MasterCard.js";
import { v4 as UUIDV4 } from "uuid";
import VehicleList from "../../model/Members/v02/VehicleList.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";
import db from "../../config/dbConfig.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";

export const uploadMemberExcel = [
  upload.single("file"),
  async (req, res) => {
    const transaction = await db.transaction();
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = xlsx.read(file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);

      const createdUsers = [];
      for (const [index, row] of rows.entries()) {
        const {
          fullname,
          email,
          address,
          username,
          phone_number,
          pin,
          gender,
          dob,
          vehicle_type,
          rfid,
          type_membership,
          location_code,
          location_name,
          plate_number,
          endDate,
        } = row;

        if (!fullname || !email || !rfid || !plate_number) {
          throw new Error(`Row ${index + 2} data tidak lengkap`);
        }

        const customerNo = Math.floor(1000000000 + Math.random() * 9000000000);
        const password = crypto.randomBytes(4).toString("hex"); // 8 karakter acak

        const user = await User.create(
          {
            fullname,
            email,
            address,
            username,
            phone_number,
            password,
            pin: pin.toString(),
            gender,
            dob,
            customer_no: customerNo,
          },
          { transaction }
        );

        const activationToken = user.createActivationToken();
        await user.save({ validate: false, transaction });

        const activationURL = `https://${req.get(
          "host"
        )}/v01/member/api/auth/activate/${activationToken}`;

        const to = user.email;
        const subject = "Welcome to SKY PARKING - Activate Your Account";
        const html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="text-align: center; padding-bottom: 20px;">
                      <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
                    </div>
                    <h2 style="color: #333;">Hi, ${user.username}</h2>
                    <p style="color: #555;">
                      Terima kasih telah menggunakan layanan membership <strong>SKY PARKING</strong>. Kami sangat senang menyambut anda!
                      Sebelum anda bisa menikmati semua keuntungan sebagai member, silakan aktifkan akun anda dengan mengklik tombol di bawah ini.
                    </p>
  
                    <ul>
                      <li><strong>Username:</strong> ${user.username}</li>
                      <li><strong>Email:</strong> ${user.email}</li>
                      <li><strong>Password:</strong> ${password}</li>
                      <li><strong>Pin:</strong> ${pin}</li>
                    </ul>
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="${activationURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        Aktifkan Akun
                      </a>
                    </div>
                    <p style="color: #555;">
                      Untuk pengambilan kartu membership anda bisa ambil di petugas SKY PARKING.
                      Jika anda mengalami masalah atau butuh bantuan lebih lanjut, jangan ragu untuk menghubungi kami.
                    </p>
                    <p style="color: #555;">
                      Best Regards,<br/>
                      <strong>SKY Parking Utama</strong>
                    </p>
                  </div>
                `;

        const attachments = [
          {
            filename: "logo.png",
            path: "./images/logo.png",
            cid: "logo",
          },
        ];

        const locationArea = await LocationArea.findOne(
          {
            where: { location_code: location_code },
          },
          { transaction }
        );

        if (!locationArea)
          throw new Error(
            `Location code '${location_code}' not found (row ${index + 2})`
          );

        const kid = locationArea.KID;

        await MasterCard.create(
          {
            id: UUIDV4(),
            no_card: rfid,
            card_type: type_membership,
            is_used: 1,
            location_code: location_code,
            location_name: location_name,
          },
          { transaction }
        );

        const memberCustomer = await VehicleList.create(
          {
            vehicle_type: vehicle_type,
            cust_id: user.id,
            member_customer_no: user.customer_no,
            rfid: rfid,
            plate_number: plate_number,
            stnk_image: "-",
            plate_number_image: "-",
          },
          { transaction }
        );

        await MembershipDetail.create(
          {
            Cust_Member: memberCustomer.id,
            location_id: location_code,
            kid,
            is_active: 1,
            is_used: 0,
            start_date: new Date(),
            end_date: endDate,
            is_active: 1,
            member_customer_no: memberCustomer.member_customer_no,
            location_name: location_name,
          },
          { transaction }
        );

        await sendEmailRegister({ to, subject, html, attachments });
        createdUsers.push({ username, email, password });
      }

      await transaction.commit();

      res.json({
        success: true,
        message: "Users created successfully",
        data: createdUsers,
      });
    } catch (err) {
      await transaction.rollback();
      console.error("Upload error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];
