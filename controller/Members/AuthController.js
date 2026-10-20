import bcrypt from "bcryptjs/dist/bcrypt.js";
import crypto from "crypto";
import { Op, Sequelize } from "sequelize";
import { createSendToken } from "../../config/ConfigToken.js";
import { sendEmailRegister } from "../../config/EmailService.js";
import User from "../../model/Members/Users.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";

import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import LocationArea from "../../model/Members/v02/LocationMaster.js";
dotenv.config({ path: ".env" });

const secret_key = process.env.SECRET_KEY;

export const login = async (req, res) => {
  const { data } = req.body;
  console.log("request", data);
  if (!data) {
    return res.status(400).json({
      status: "fail",
      message: "Data tidak boleh kosong.",
    });
  }

  const bytes = CryptoJS.AES.decrypt(data, secret_key);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  const { identifier, password, rememberMe } = decryptedData;

  if (!identifier || !password) {
    return res.status(400).json({
      status: "fail",
      message:
        "Harap masukkan identifier (username, email, atau nomor telepon) dan password.",
    });
  }

  try {
    // Cari user di database User
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { username: identifier },
          { email: identifier },
          { phone_number: identifier },
        ],
      },
    });

    // Jika tidak ditemukan di User, cari di UserCMS
    if (!user) {
      user = await UserCMS.findOne({
        where: {
          [Op.or]: [
            { username: identifier },
            { email: identifier },
            { phone_number: identifier },
          ],
        },
      });

      // Jika juga tidak ditemukan di UserCMS, return error
      if (!user) {
        return res.status(401).json({
          status: "fail",
          message: "Akun Anda tidak ditemukan di sistem.",
        });
      }
    }

    // Validasi password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "fail",
        message: "Password yang Anda masukkan salah.",
      });
    }

    const now = new Date();

    if (
      user.expired_active &&
      user.expired_active <= now &&
      user.is_active === 0
    ) {
      return res.status(401).json({
        code: 401002,
        status: "fail",
        request: true,
        message:
          "Token aktivasi telah kedaluwarsa. Silakan request ulang aktivasi.",
      });
    }

    // Periksa status aktif
    if (user.is_active !== 1) {
      return res.status(401).json({
        code: 401001,
        status: "fail",
        message: "Akun Anda belum aktif. Silakan cek email untuk aktivasi.",
      });
    }

    // if (!user.active_token) {
    //   return res.status(401).json({
    //     code: 401003,
    //     status: "fail",
    //     message:
    //       "Akun Anda belum registrasi. Silakan registrasi terlebih dahulu.",
    //   });
    // }

    // Jika semua validasi lolos, buat token dan kirimkan respons sukses
    createSendToken(user, 200, res, rememberMe);
  } catch (error) {
    // Tangani error lainnya
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
      error: error.message, // Opsional: Hapus di produksi jika terlalu sensitif
    });
  }
};

export const requestTokenActivation = async (req, res) => {
  try {
    const { email, referralUrl } = req.body;
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: email }],
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User dengan email tersebut tidak ditemukan.",
      });
    }

    if (user.is_active === 1) {
      return res.status(400).json({
        status: "fail",
        message: "User sudah aktif.",
      });
    }

    const URL_MEMBERSHIP_BACKEND = process.env.URL_DIRECT_BACKEND;
    const URL_MEMBERSHIP = process.env.URL_DIRECT_MEMBERSHIP;
    const activationToken = newUser.createActivationToken(URL_MEMBERSHIP);
    await newUser.save({ validate: false });

    const activationURL = `${URL_MEMBERSHIP_BACKEND}/v01/member/api/auth/activate/${activationToken}?referralUrl=${URL_MEMBERSHIP}`;

    const to = user.email;
    const subject = "Welcome to SKY PARKING - Activate Your Account";
    const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; padding-bottom: 20px;">
              <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333;">Hi, ${user.username}</h2>
            <p style="color: #555;">
              Terima kasih telah menggunakan layanan membership <strong>SKY PARKING</strong>. Kami sangat senang menyambut kamu!
              Sebelum kamu bisa menikmati semua keuntungan sebagai member, silakan aktifkan akunmu dengan mengklik tombol di bawah ini.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${activationURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                Aktifkan Akun
              </a>
            </div>
            <p style="color: #555;">
              Jika kamu mengalami masalah atau butuh bantuan lebih lanjut, jangan ragu untuk menghubungi kami.
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

    await sendEmailRegister({ to, subject, html, attachments });

    res.status(200).json({
      status: "success",
      message: "Token aktivasi telah dikirimkan ke email Anda.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
      error: error.message, // Opsional: Hapus di produksi jika terlalu sensitif
    });
  }
};

import { randomBytes } from "node:crypto";
import path from "node:path";

export const requestResetPassword = async (req, res) => {
  let user;

  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "Alamat email wajib diisi.",
      });
    }

    const identifier = email.trim();

    user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { username: identifier }],
      },
    });

    // Gunakan respons yang sama untuk mencegah enumerasi akun.
    const successResponse = {
      status: "success",
      message:
        "Jika akun ditemukan, instruksi reset password akan dikirim ke email terdaftar.",
    };

    if (!user) {
      return res.status(200).json(successResponse);
    }

    if (!user.email) {
      return res.status(200).json(successResponse);
    }

    // Token acak kriptografis dengan masa berlaku 15 menit.
    const token = randomBytes(32).toString("hex");
    const expired = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      reset_password_token: token,
      reset_password_expired: expired,
    });

    // URL ini harus mengarah ke frontend yang memiliki halaman change-password.
    const frontendUrl = process.env.URL_DIRECT_MEMBERSHIP;

    if (!frontendUrl) {
      throw new Error("URL_DIRECT_MEMBERSHIP belum dikonfigurasi.");
    }

    const resetUrl = new URL(
      "/change-password",
      frontendUrl.endsWith("/") ? frontendUrl : `${frontendUrl}/`,
    );

    resetUrl.searchParams.set("token", token);

    const subject = "Reset Password Akun SKY Membership";

    const username = String(user.username || "Member").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

    const resetLink = resetUrl.toString();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0f172a; padding: 28px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0;">SKY Membership</h1>
          <p style="color: #cbd5e1; font-size: 13px; margin: 8px 0 0;">Password Reset Request</p>
        </div>

        <div style="padding: 32px 28px;">
          <h2 style="color: #0f172a; font-size: 21px;">Halo, ${username}!</h2>

          <p style="color: #475569; font-size: 15px; line-height: 1.8;">
            Kami menerima permintaan untuk mengatur ulang password akun SKY Membership kamu.
            Klik tombol di bawah untuk membuat password baru.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.7;">
            Link ini berlaku selama <strong>15 menit</strong> sejak permintaan dibuat dan hanya dapat digunakan sesuai aturan validasi token di server.
          </p>

          <p style="color: #64748b; font-size: 13px; line-height: 1.7;">
            Jika tombol tidak dapat dibuka, salin tautan berikut ke browser:
          </p>

          <p style="word-break: break-all; font-size: 12px; line-height: 1.7;">
            <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
          </p>

          <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 10px;">
            <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
              Jika kamu tidak meminta reset password, abaikan email ini. Password akun kamu tidak akan berubah tanpa proses reset yang valid.
            </p>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.7; margin-top: 28px;">
            Salam,<br />
            <strong>IT Support SKY Parking</strong>
          </p>
        </div>

        <div style="padding: 18px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} SKY Parking. All rights reserved.
          </p>
          <p style="margin: 6px 0 0; color: #94a3b8; font-size: 12px;">
            Email otomatis. Mohon tidak membalas pesan ini.
          </p>
        </div>
      </div>
    `;

    const attachments = [
      {
        filename: "logo.png",
        path: path.resolve(process.cwd(), "images/logo.png"),
        cid: "logo",
      },
    ];

    await sendEmailRegister({
      to: user.email,
      subject,
      html,
      attachments,
    });

    return res.status(200).json(successResponse);
  } catch (error) {
    console.error("requestResetPassword failed:", {
      message: error instanceof Error ? error.message : String(error),
    });

    // Batalkan token yang baru dibuat jika email gagal dikirim.
    if (user) {
      try {
        await user.update({
          reset_password_token: null,
          reset_password_expired: null,
        });
      } catch (cleanupError) {
        console.error("Failed to clear reset token:", cleanupError);
      }
    }

    return res.status(500).json({
      status: "error",
      message:
        "Permintaan reset password belum dapat diproses. Silakan coba kembali.",
    });
  }
};

export const requestResetPin = async (req, res) => {
  try {
    const randomString = Date.now().toString() + Math.random().toString();
    const token = CryptoJS.SHA256(randomString).toString(CryptoJS.enc.Hex); // Hash unik
    const expired = new Date(Date.now() + 1000 * 60 * 15);
    const id = req.userId;
    const { referralUrl } = req.body;

    const user = await User.findOne({
      where: id,
    });

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User tidak ditemukan.",
      });
    }

    await user.update({
      reset_pin_token: token,
      reset_pin_expired: expired,
    });

    const activationURL = `${referralUrl}/change-pin?token=${token}`;

    const to = user.email;
    const subject = "Welcome to SKY PARKING - Reset Your Pin";
    const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; padding-bottom: 20px;">
              <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333;">Hi, ${user.username}</h2>
            <p style="color: #555;">
              Terima kasih telah menggunakan layanan membership <strong>SKY PARKING</strong>. Kami sangat senang membantu anda!
              Silahkan ubah pin anda dengan klik tombol di bawah
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${activationURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                Ganti Pin
              </a>
            </div>
            <p style="color: #555;">
              Jika kamu mengalami masalah atau butuh bantuan lebih lanjut, jangan ragu untuk menghubungi kami.
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

    await sendEmailRegister({ to, subject, html, attachments });

    res.status(200).json({
      status: "success",
      message: "Token reset telah dikirimkan ke email Anda.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
      error: error.message, // Opsional: Hapus di produksi jika terlalu sensitif
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expired: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Token reset sudah kadaluarsa.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Password dan konfirmasi password tidak cocok.",
      });
    }

    user.password = password;
    user.is_active = 1;

    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password berhasil diubah.",
    });
  } catch (error) {
    res.status(400).json({
      statusCode: 400,
      message: error.message,
    });
  }
};
export const changePin = async (req, res) => {
  try {
    const { pin, confirmPin, token } = req.body;

    const user = await User.findOne({
      where: {
        reset_pin_token: token,
        reset_pin_expired: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Token reset sudah kadaluarsa.",
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        status: "fail",
        message: "PIN dan konfirmasi PIN tidak cocok.",
      });
    }

    user.pin = pin;

    await user.save();

    res.status(200).json({
      status: "success",
      message: "PIN berhasil diubah.",
    });
  } catch (error) {
    res.status(400).json({
      statusCode: 400,
      message: error.message,
    });
  }
};

export const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      address,
      username,
      password,
      phone_number,
      pin,
      gender,
      dob,
      referralUrl,
    } = req.body;

    // Generate a unique customer number
    const customerNo = Math.floor(1000000000 + Math.random() * 9000000000); // Generate a random 10-digit number

    const newUser = await User.create({
      fullname: fullname,
      username: username,
      email: email,
      address: address,
      password: password,
      phone_number: phone_number,
      pin: pin ?? null,
      gender: gender,
      dob: dob,
      customer_no: customerNo, // Include the generated customer number
    });
    const URL_MEMBERSHIP_BACKEND = process.env.URL_DIRECT_BACKEND;
    const URL_MEMBERSHIP = process.env.URL_DIRECT_MEMBERSHIP;
    const activationToken = newUser.createActivationToken(URL_MEMBERSHIP);
    await newUser.save({ validate: false });

    const activationURL = `${URL_MEMBERSHIP_BACKEND}/v01/member/api/auth/activate/${activationToken}?referralUrl=${URL_MEMBERSHIP}`;

    const to = newUser.email;
    const subject =
      "Selamat Datang di SKY PARKING - Aktifkan Akun Membership Anda";
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      
      <div style="background-color: #f8f9fa; text-align: center; padding: 30px 20px; border-bottom: 4px solid #007bff;">
        <img src="cid:logo" alt="SKY Parking Logo" style="width: 180px; height: auto;" />
      </div>

      <div style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0; font-size: 24px;">Halo, ${newUser.username}!</h2>
        
        <p style="color: #555555; font-size: 16px;">
          Terima kasih telah bergabung menjadi member <strong>SKY PARKING</strong>. Kami senang Anda menjadi bagian dari komunitas kami!
        </p>
        
        <p style="color: #555555; font-size: 16px;">
          Satu langkah lagi untuk menikmati berbagai keuntungan eksklusif. Silakan aktifkan akun Anda melalui tombol di bawah ini:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${activationURL}" style="background-color: #007bff; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.2);">
            AKTIFKAN AKUN SAYA
          </a>
        </div>

        <div style="background-color: #fff9db; border-left: 4px solid #fcc419; padding: 15px; margin-bottom: 25px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Informasi Kartu:</strong> Pengambilan kartu fisik membership dapat dilakukan di booth petugas <strong>SKY PARKING</strong> terdekat dengan menunjukkan email ini.
          </p>
        </div>

        <p style="color: #555555; font-size: 15px;">
          Jika Anda mengalami kendala atau memiliki pertanyaan, tim support kami siap membantu Anda kapan saja.
        </p>

        <p style="color: #333333; font-size: 15px; margin-top: 30px;">
          Salam hangat,<br/>
          <strong>Management SKY Parking Utama</strong>
        </p>
      </div>

      <div style="background-color: #f8f9fa; text-align: center; padding: 20px; color: #999999; font-size: 12px; border-top: 1px solid #eeeeee;">
        <p style="margin: 5px 0;">&copy; 2026 SKY Parking Utama. All rights reserved.</p>
        <p style="margin: 5px 0;">Jl. Contoh Alamat No. 123, Jakarta, Indonesia</p>
      </div>
    </div>
`;

    const attachments = [
      {
        filename: "logo.png",
        path: "./images/logo.png",
        cid: "logo",
      },
    ];

    await sendEmailRegister({ to, subject, html, attachments });

    createSendToken(newUser, 201, res);
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const errorField = err.errors[0].path; // Mendapatkan nama field yang menyebabkan error
      const errorMessage = `${errorField} sudah digunakan. Mohon gunakan yang lain.`;
      return res.status(400).json({
        status: "fail",
        message: errorMessage,
      });
    }

    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const registerEncrypt = async (req, res) => {
  try {
    const { data } = req.body;

    const bytes = CryptoJS.AES.decrypt(data, secret_key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const prefix = "03";
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    // const datePart = `${year}${month}${date}`;
    const random = Math.floor(100 + Math.random() * 900);
    const customerNo = `${prefix}${year}${month}${date}${random}`; // Generate a random 10-digit number

    const dob = new Date(decryptedData.dob);

    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid date format",
      });
    }
    const referralUrl = decryptedData.referalURL ?? null;

    const payloadData = {
      fullname: decryptedData.fullname,
      username: decryptedData.username,
      email: decryptedData.email,
      address: decryptedData.address,
      password: decryptedData.password,
      phone_number: decryptedData.phone_number.toString(),
      pin: decryptedData.pin ?? null,
      gender: decryptedData.gender,
      dob: dob,
      customer_no: customerNo, // Include the generated customer number
    };

    const newUser = await User.create(payloadData, {
      validate: false,
    });

    const URL_MEMBERSHIP_BACKEND = process.env.URL_DIRECT_BACKEND;
    const URL_MEMBERSHIP = process.env.URL_DIRECT_MEMBERSHIP;
    const activationToken = newUser.createActivationToken(URL_MEMBERSHIP);
    await newUser.save({ validate: false });

    const activationURL = `${URL_MEMBERSHIP_BACKEND}/v01/member/api/auth/activate/${activationToken}?referralUrl=${URL_MEMBERSHIP}`;

    const to = newUser.email;
    const subject =
      "Selamat Datang di SKY PARKING - Aktifkan Akun Membership Anda";
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      
      <div style="background-color: #f8f9fa; text-align: center; padding: 30px 20px; border-bottom: 4px solid #007bff;">
        <img src="cid:logo" alt="SKY Parking Logo" style="width: 180px; height: auto;" />
      </div>

      <div style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0; font-size: 24px;">Halo, ${newUser.username}!</h2>
        
        <p style="color: #555555; font-size: 16px;">
          Terima kasih telah bergabung menjadi member <strong>SKY PARKING</strong>. Kami senang Anda menjadi bagian dari komunitas kami!
        </p>
        
        <p style="color: #555555; font-size: 16px;">
          Satu langkah lagi untuk menikmati berbagai keuntungan eksklusif. Silakan aktifkan akun Anda melalui tombol di bawah ini:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${activationURL}" style="background-color: #007bff; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.2);">
            AKTIFKAN AKUN SAYA
          </a>
        </div>

        <div style="background-color: #fff9db; border-left: 4px solid #fcc419; padding: 15px; margin-bottom: 25px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Informasi Kartu:</strong> Pengambilan kartu fisik membership dapat dilakukan di booth petugas <strong>SKY PARKING</strong> terdekat dengan menunjukkan email ini.
          </p>
        </div>

        <p style="color: #555555; font-size: 15px;">
          Jika Anda mengalami kendala atau memiliki pertanyaan, tim support kami siap membantu Anda kapan saja.
        </p>

        <p style="color: #333333; font-size: 15px; margin-top: 30px;">
          Salam hangat,<br/>
          <strong>Management SKY Parking Utama</strong>
        </p>
      </div>

      <div style="background-color: #f8f9fa; text-align: center; padding: 20px; color: #999999; font-size: 12px; border-top: 1px solid #eeeeee;">
        <p style="margin: 5px 0;">&copy; 2026 SKY Parking Utama. All rights reserved.</p>
        <p style="margin: 5px 0;">Jl. Contoh Alamat No. 123, Jakarta, Indonesia</p>
      </div>
    </div>
`;

    const attachments = [
      {
        filename: "logo.png",
        path: "./images/logo.png",
        cid: "logo",
      },
    ];

    await sendEmailRegister({ to, subject, html, attachments });

    createSendToken(newUser, 201, res);
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const errorField = err.errors[0].path; // Mendapatkan nama field yang menyebabkan error
      const errorMessage = `${errorField} sudah digunakan. Mohon gunakan yang lain.`;
      return res.status(400).json({
        status: "fail",
        message: errorMessage,
      });
    }

    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const referralUrl = req.query.referralUrl;
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    console.log("referal", referralUrl);
    console.log("hashed", hashedToken);

    const user = await User.findOne({
      where: {
        active_token: hashedToken,
        expired_active: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.redirect(`${referralUrl}/request-token?error=expired`);
    }

    user.is_active = 1;
    user.active_token = null; // Opsional: hapus token setelah pakai
    await user.save();

    return res.redirect(`${referralUrl}/register-success`);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
export const activateAccountCMS = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const userCMS = await UserCMS.findOne({
      where: {
        active_token: hashedToken,
        expired_active: { [Op.gt]: Date.now() },
      },
    });

    if (!userCMS) {
      const allowedDomains =
        `${req.protocol}://${req.get("host")}` === "http://localhost:3008/admin"
          ? "http://localhost:3000/admin"
          : "https://membership.skyparking.online/admin";

      return res.redirect(`${allowedDomains}/request-token`);
    }

    const allowedDomains =
      `${req.protocol}://${req.get("host")}` === "http://localhost:3008/admin"
        ? "http://localhost:3000/admin"
        : `https://membership.skyparking.online/admin`;

    if (userCMS) {
      userCMS.is_active = 1;
      await userCMS.save();
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    res.redirect(`${allowedDomains}/register-success/cms`);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const result = await User.findOne({
      where: { username: username },
      attributes: ["id", "fullname", "email"],
      // include: [
      //   {
      //     model: VehicleList,
      //     // where: { isActive: 1 },
      //     attributes: ["member_customer_no", "rfid", "vehicle_type"],
      //     required: false,
      //     include: [
      //       {
      //         model: MembershipDetail,
      //         where: { is_active: 1 },
      //         attributes: ["is_active", "location_id"],
      //       },
      //     ],
      //   },
      // ],
    });

    if (!result) {
      return res.status(404).json({
        statusCode: 404,
        message: "No users found with that ID",
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.userId;
    const userById = await User.findOne({
      where: { id: userId },
      attributes: [
        "id",
        "fullname",
        "email",
        "points",
        "reward_points",
        "customer_no",
        "phone_number",
        "username",
        "gender",
        "dob",
        "address",
        "is_active",
      ],
      include: [
        {
          model: VehicleList,
          // where: { isActive: 1 },
          attributes: ["member_customer_no", "rfid", "vehicle_type"],
          required: false,
          include: [
            {
              model: MembershipDetail,
              as: "membershipDetail",
              where: { is_active: 1 },
              attributes: ["is_active", "location_id"],
            },
          ],
        },
      ],
    });

    if (!userById) {
      return res.status(404).json({
        statusCode: 404,
        message: "No users found with that ID",
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Users retrieved successfully",
      data: userById,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getCardDetail = async (req, res) => {
  try {
    const userId = req.userId;

    // Ambil semua kendaraan milik user
    const cardDetail = await VehicleList.findAll({
      where: { cust_id: userId, rfid: { [Op.not]: "" } },
      group: ["rfid"],
      attributes: [
        "member_customer_no",
        "rfid",
        "vehicle_type",
        "plate_number",
      ],
      include: [
        {
          model: MembershipDetail,
          as: "membershipDetail",
          attributes: ["is_active", "location_id"],
        },
      ],
    });

    res.status(200).json({
      statusCode: 200,
      message: "Membership Detail retrieved successfully",
      data: cardDetail,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getListCardDetail = async (req, res) => {
  try {
    const userId = req.userId;
    const rfid = req.params.rfid;

    // Ambil semua kendaraan milik user
    const cardDetail = await VehicleList.findOne({
      where: { cust_id: userId, rfid: { [Op.not]: "" }, rfid: rfid },
      attributes: [
        "member_customer_no",
        "rfid",
        "plate_number",
        "vehicle_type",
      ],
    });

    const locationMember = await MembershipDetail.findAll({
      where: { member_customer_no: cardDetail.member_customer_no },
    });

    const response = {
      detail: {
        member_customer_no: cardDetail.member_customer_no,
        rfid: cardDetail.rfid,
        plateNumber: cardDetail.plate_number,
        vehicleType: cardDetail.vehicle_type,
        location: locationMember,
      },
    };

    res.status(200).json({
      statusCode: 200,
      message: "Membership Detail retrieved successfully",
      data: response,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const getUserByIdDetail = async (req, res) => {
  const userId = req.userId;
  const { Pin } = req.body;

  try {
    const users = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!users || !(await users.correctPassword(Pin, users.pin))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect pin",
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Pin is valid",
    });
  } catch (err) {
    res.status(401).json({
      statusCode: 401,
      message: err.message,
    });
  }
};

export const logout = (req, res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const getAllUsers = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const offset = (page - 1) * limit;

    // Query pertama untuk menghitung total user di tabel User tanpa include
    const totalUsers = await User.count();

    // Query kedua untuk mendapatkan data user dengan relasi yang diinginkan
    const rows = await User.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    // Menghitung total halaman
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      total: totalUsers,
      totalPages: totalPages,
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCardOrPlat = async (req, res) => {
  try {
    // Mengambil query parameter dari URL, misal: /api/cards?search=B1234
    const { search } = req.query;

    let whereCondition = {};

    // Jika ada parameter search, tambahkan kondisi OR untuk rfid dan plate_number
    if (search) {
      whereCondition = {
        [Op.or]: [
          { rfid: { [Op.like]: `%${search}%` } },
          { plate_number: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const cardDetail = await VehicleList.findAll({
      where: whereCondition, // Masukkan kondisi filter di sini
      group: ["rfid"],
      attributes: [
        "id",
        "member_customer_no",
        "rfid",
        "vehicle_type",
        "plate_number",
      ],
      include: [
        {
          model: MembershipDetail,
          as: "membershipDetail",
          attributes: ["is_active", "location_id", "updated_at", "end_date"],
          include: [
            {
              model: LocationArea,
              as: "locationArea",
              attributes: ["location_name"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      statusCode: 200,
      message: "Membership Detail retrieved successfully",
      count: cardDetail.length,
      data: cardDetail,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};
