import User from "../../model/Members/Users.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Op, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { errorResponse, successResponse } from "../../config/response.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import { sendEmailRegister } from "../../config/EmailService.js";
import { createSendToken } from "../../config/ConfigToken.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";
import dotenv from "dotenv";
import CryptoJS from "crypto-js";
dotenv.config({ path: ".env" });

const secret_key = process.env.SECRET_KEY;

export const login = async (req, res) => {
  const { data } = req.body;

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

    if (!user.active_token) {
      return res.status(401).json({
        code: 401003,
        status: "fail",
        message:
          "Akun Anda belum registrasi. Silakan registrasi terlebih dahulu.",
      });
    }

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

    const activationToken = user.createActivationToken(referralUrl);
    await user.save({ validate: false });

    const activationURL = `${req.protocol}://${req.get(
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

export const requestResetPassword = async (req, res) => {
  try {
    const randomString = Date.now().toString() + Math.random().toString();
    const token = CryptoJS.SHA256(randomString).toString(CryptoJS.enc.Hex); // Hash unik
    const expired = new Date(Date.now() + 1000 * 60 * 15);

    const { email, referralUrl } = req.body;
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: email }],
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User tidak ditemukan.",
      });
    }

    await user.update({
      reset_password_token: token,
      reset_password_expired: expired,
    });

    const activationURL = `${referralUrl}/change-password?token=${token}`;

    const to = user.email;
    const subject = "Welcome to SKY PARKING - Reset Your Password";
    const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; padding-bottom: 20px;">
              <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333;">Hi, ${user.username}</h2>
            <p style="color: #555;">
              Terima kasih telah menggunakan layanan membership <strong>SKY PARKING</strong>. Kami sangat senang membantu anda!
              Silahkan ubah password anda dengan klik tombol di bawah
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${activationURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                Ganti password
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
      pin: pin,
      gender: gender,
      dob: dob,
      customer_no: customerNo, // Include the generated customer number
    });

    const activationToken = newUser.createActivationToken(referralUrl);
    await newUser.save({ validate: false });

    const activationURL = `${req.protocol}://${req.get(
      "host"
    )}/v01/member/api/auth/activate/${activationToken}`;

    const to = newUser.email;
    const subject = "Welcome to SKY PARKING - Activate Your Account";
    const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; padding-bottom: 20px;">
              <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333;">Hi, ${newUser.username}</h2>
            <p style="color: #555;">
              Terima kasih telah menggunakan layanan membership <strong>SKY PARKING</strong>. Kami sangat senang menyambut anda!
              Sebelum anda bisa menikmati semua keuntungan sebagai member, silakan aktifkan akun anda dengan mengklik tombol di bawah ini.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${activationURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                Aktifkan Akun
              </a>
            </div>
            <p style="color: #555;">
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
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      where: {
        active_token: hashedToken,
        expired_active: { [Op.gt]: Date.now() },
      },
    });

    console.log(user);

    const userCMS = await UserCMS.findOne({
      where: {
        active_token: hashedToken,
        expired_active: { [Op.gt]: Date.now() },
      },
    });

    if (!user && !userCMS) {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    const allowedDomains =
      `${req.protocol}://${req.get("host")}` === "http://localhost:3008"
        ? "http://localhost:3000"
        : `https://dev-membership.skyparking.online`;

    if (user) {
      user.is_active = 1;
      await user.save();
    } else if (userCMS) {
      userCMS.is_active = 1;
      await userCMS.save();
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    res.redirect(`${allowedDomains}/register-success`);
  } catch (err) {
    res.status(400).json({
      status: "fail",
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
              where: { is_active: 1 },
              attributes: ["is_active"],
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
