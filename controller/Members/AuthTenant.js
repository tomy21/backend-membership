import MemberTenant from "../../model/Members/MemberTenants.js";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import { Op } from "sequelize";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import { createSendToken } from "../../config/ConfigToken.js";
dotenv.config({ path: ".env.production" });
const secret_key = process.env.SECRET_KEY;

export const loginTennant = async (req, res) => {
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
    const user = await MemberTenant.findOne({
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
