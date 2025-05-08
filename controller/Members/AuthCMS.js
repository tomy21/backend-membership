import { Op, Sequelize } from "sequelize";
import { createSendToken } from "../../config/ConfigToken.js";
import { sendEmailRegister } from "../../config/EmailService.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import { MemberUserRole } from "../../model/Master/RoleModel.js";

export const login = async (req, res) => {
  const { identifier, password, rememberMe } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      status: "fail",
      message:
        "Harap masukkan sadf identifier (username, email, atau nomor telepon) dan password.",
    });
  }

  try {
    // Cari user di database User
    const user = await UserCMS.findOne({
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

    await user.update({ last_login: new Date() });
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

function generatePassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const isValidInput = (field, input) => {
  const inputValidators = {
    fullname: /^[a-zA-Z0-9\s._-]+$/,
    username: /^[a-zA-Z0-9\s._-]+$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone_number: /^\+?[0-9]+$/,
    referralUrl: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    role: /^[0-9]+$/,
  };

  return inputValidators[field]?.test(input);
};

const validateInput = (field, input) => {
  if (!isValidInput(field, input)) {
    return field; // Mengembalikan nama field jika tidak valid
  }
  return null; // Mengembalikan null jika valid
};

export const registerCMS = async (req, res) => {
  try {
    const { fullname, email, username, phone_number, role, referralUrl } =
      req.body;

    // Validasi input untuk memastikan hanya teks tanpa script
    const invalidField =
      validateInput("fullname", fullname) ||
      validateInput("email", email) ||
      validateInput("username", username) ||
      validateInput("phone_number", phone_number) ||
      validateInput("referralUrl", referralUrl) ||
      validateInput("role", role.toString());

    // Jika ada field yang tidak valid, kirimkan pesan error dengan nama field
    if (invalidField) {
      return res.status(400).json({
        status: "fail",
        message: `Input pada field "${invalidField}" mengandung karakter tidak valid.`,
      });
    }

    // Cek apakah username, email, atau phone_number sudah digunakan
    const existingUser = await UserCMS.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username: username },
          { email: email },
          { phone_number: phone_number },
        ],
      },
    });

    if (existingUser) {
      let conflictField = "";
      if (existingUser.username === username) conflictField = "Username";
      if (existingUser.email === email) conflictField = "Email";
      if (existingUser.phone_number === phone_number)
        conflictField = "Nomor Telepon";
      return res.status(400).json({
        status: "fail",
        message: `${conflictField} sudah digunakan. Mohon gunakan yang lain.`,
      });
    }

    // Generate password
    const password = generatePassword();

    // Buat user baru
    const newUser = await UserCMS.create({
      fullname,
      username,
      email,
      password,
      phone_number,
      role,
      created_by: "admin",
    });

    // Token aktivasi
    const activationToken = newUser.createActivationToken(referralUrl);
    await newUser.save({ validate: false });

    const activationURL = `${req.protocol}://${req.get(
      "host"
    )}/v01/member/api/auth/activate/${activationToken}`;

    // Kirim email aktivasi
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
            Berikut adalah informasi login akun Anda:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #555;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f7f7f7; width: 30%;"><strong>Username</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${newUser.username}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f7f7f7;"><strong>Email</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${newUser.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f7f7f7;"><strong>Password</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${password}</td>
            </tr>
          </table>
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

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: newUser,
    });
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const errorField = err.errors[0].path;
      const errorMessage = `${errorField} sudah digunakan. Mohon gunakan yang lain.`;
      return res.status(400).json({
        status: "fail",
        message: errorMessage,
      });
    }
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

export const getUserByIdCMS = async (req, res) => {
  try {
    const userId = req.userId;

    const userById = await UserCMS.findOne({
      where: { id: userId },
      attributes: ["id", "fullname", "email"],
      include: [
        {
          model: MemberUserRole,
          attributes: ["name"],
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

export const getUserCMS = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const users = await UserCMS.findAndCountAll({
      where: {
        [Op.or]: [
          { fullname: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } },
          { phone_number: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: [
        "id",
        "fullname",
        "email",
        "phone_number",
        "username",
        "role",
        "is_active",
        "last_login",
      ],
      include: [
        {
          model: MemberUserRole,
          attributes: ["name"],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    if (!users) {
      return res.status(404).json({
        statusCode: 404,
        message: "No users found with that ID",
      });
    }
    res.status(200).json({
      totalItems: users.count,
      totalPages: Math.ceil(users.count / limit),
      currentPage: parseInt(page),
      data: users.rows,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const softDeleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserCMS.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Soft delete the user
    await user.destroy();

    res
      .status(200)
      .json({ statusCode: 200, message: "User soft deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

export const logoutCMS = (req, res) => {
  res.cookie("refreshToken", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    domain: ".skyparking.online",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};
