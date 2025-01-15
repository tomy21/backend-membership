import User from "../../model/Members/Users.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Op, Sequelize } from "sequelize";
import UserDetails from "../../model/Members/UserDetails.js";
import { v4 as uuidv4 } from "uuid";
import MemberUserProduct from "../../model/Members/MemberUserProduct.js";
import { errorResponse, successResponse } from "../../config/response.js";
import MemberRole from "../../model/Members/RoleModel.js";
import MemberUserRole from "../../model/Members/MemberUserRoles.js";
import MemberUserToken from "../../model/Members/MemberUserToken.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import MembershipCard from "../../model/Members/v02/MembershipCard.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import { sendEmailRegister } from "../../config/EmailService.js";
import { createSendToken } from "../../config/ConfigToken.js";

export const login = async (req, res) => {
  const { identifier, password, rememberMe } = req.body;

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

    // Periksa status aktif
    if (user.is_active !== 1) {
      if (!user.active_token) {
        return res.status(401).json({
          status: "fail",
          message:
            "Akun Anda belum diaktivasi. Silakan cek email untuk aktivasi.",
        });
      }

      // Cek apakah token sudah kedaluwarsa
      const now = new Date();
      if (user.expired_active && user.expired_active <= now) {
        return res.status(401).json({
          status: "fail",
          request: true,
          message:
            "Token aktivasi telah kedaluwarsa. Silakan request ulang aktivasi.",
        });
      }

      return res.status(401).json({
        status: "fail",
        message: "Akun Anda belum aktif. Silakan cek email untuk aktivasi.",
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

    const to = newUser.email;
    const subject = "Welcome to SKY PARKING - Activate Your Account";
    const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; padding-bottom: 20px;">
              <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333;">Hi, ${newUser.username}</h2>
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

    const allowedDomains = [
      "http://localhost:3000",
      "https://dev-membership.skyparking.online",
    ];

    let referralUrl =
      req.query.referralUrl || "https://dev-membership.skyparking.online";
    if (!allowedDomains.some((domain) => referralUrl.startsWith(domain))) {
      referralUrl = "https://default.com";
    }

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

    res.redirect(`${referralUrl}/registerSuccess`);
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
          model: MembershipCard,
          where: { isActive: 1 },
          attributes: ["customerNo", "RFID_Data", "vehicleType", "isActive"],
          required: false,
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
    console.log(await users.correctPassword(Pin, users.pin));
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
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const logout = (req, res) => {
  res.cookie("refreshToken", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
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
      // include: [
      //   {
      //     model: UserDetails,
      //     attributes: ["Points"],
      //   },
      //   {
      //     model: MemberUserProduct,
      //     attributes: ["CardId"],
      //   },
      //   {
      //     model: MemberUserRole,
      //     attributes: ["RoleId"],
      //   },
      // ],
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

export const userRole = async (req, res) => {
  try {
    const { Name, NormalizedName, ConcurrencyStamp } = req.body;
    const role = await MemberRole.create({
      Name,
      NormalizedName,
      ConcurrencyStamp,
    });
    return successResponse(res, 200, "Get Data successfully", {
      role,
    });
  } catch (err) {
    return errorResponse(res, 500, "Error", err.message);
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await MemberRole.findAll();
    return successResponse(res, 200, "Get Data successfully", {
      roles,
    });
  } catch (error) {
    return errorResponse(res, 500, "Error", error.message);
  }
};

export const getRoleById = async (req, res) => {
  try {
    const dataRoles = await MemberUserRole.findByPk(req.userId);
    return successResponse(res, 200, "Get Data successfully", {
      dataRoles,
    });
  } catch (error) {
    return errorResponse(res, 500, "Error", error.message);
  }
};

export const updateUserDetails = async (req, res) => {
  const id = req.userId;
  const {
    FullName,
    IpAddress,
    Gender,
    Birthdate,
    Address,
    IdNumber,
    Points,
    RewardPoints,
    P256dh,
    Auth,
    Url,
    Pin,
  } = req.body;

  try {
    const user = await UserDetails.findOne({ where: { Id: id } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.FullName = FullName || user.FullName;
    user.IpAddress = IpAddress || user.IpAddress;
    user.Gender = Gender || user.Gender;
    user.Birthdate = Birthdate || user.Birthdate;
    user.Address = Address || user.Address;
    user.IdNumber = IdNumber || user.IdNumber;
    user.Points = Points !== undefined ? Points : user.Points; // Check if Points is explicitly passed
    user.RewardPoints =
      RewardPoints !== undefined ? RewardPoints : user.RewardPoints;
    user.P256dh = P256dh || user.P256dh;
    user.Auth = Auth || user.Auth;
    user.Url = Url || user.Url;
    user.Pin = Pin || user.Pin;

    // Save the updated user details
    await user.save();

    res.status(200).json({
      message: "User details updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { Email: email } });
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const data = await MemberUserToken.create({
      UserId: user.id,
      LoginProvider: "reset_password",
      Name: "password_reset_token",
      Value: hashedToken,
      ExpiredDate: new Date(Date.now() + 30 * 60 * 1000), // Token berlaku 30 menit
    });

    // Kirim email dengan token
    const resetURL = `https://membership.skyparking.online/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com", // Server SMTP Outlook
      port: 587, // Port SMTP
      secure: false, // Gunakan false untuk port 587
      auth: {
        user: process.env.EMAIL_USER, // Gantilah dengan email pengguna Outlook Anda
        pass: process.env.EMAIL_PASS, // Gantilah dengan password email pengguna Outlook Anda
      },
      tls: {
        ciphers: "SSLv3", // Menetapkan cipher yang aman
      },
    });

    // Contoh pengiriman email
    const mailOptions = {
      from: process.env.EMAIL_USER, // Gantilah dengan email pengguna Outlook Anda
      to: email, // Email tujuan
      subject: "Account Activation",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="text-align: center; padding-bottom: 20px;">
            <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
          </div>
          <h2 style="color: #333;">Hi,</h2>
          <p style="color: #555;">
            Password anda akan di reset silahkan klik button di bawah ini untuk memasukan password baru
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
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
      `,
      attachments: [
        {
          filename: "logo.png", // Nama file yang akan muncul di email
          path: "./images/logo.png", // Path ke file gambar yang berada di direktori lokal
          cid: "logo", // Content-ID yang digunakan di dalam body email
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: "success",
      message: "Reset password email sent successfully",
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const memberUserToken = await MemberUserToken.findOne({
      where: {
        Value: hashedToken,
        ExpiredDate: { [Op.gt]: new Date() }, // Cek apakah token belum expired
      },
    });

    if (!memberUserToken) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid or expired token" });
    }
    const user = await User.findByPk(memberUserToken.UserId);
    user.PasswordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res
      .status(200)
      .json({ status: "success", message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
