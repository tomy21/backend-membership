import jwt from "jsonwebtoken";
import User from "../../model/Members/Users.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";

export const protect = async (req, res, next) => {
  let token;

  // Ambil token dari cookie
  if (req.cookies && req.cookies.refreshToken) {
    token = req.cookies.refreshToken;
  }

  // Jika token tidak ada
  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "Anda belum login. Silakan login untuk mendapatkan akses.",
    });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    // Cari user berdasarkan ID yang ada di token
    const currentUser =
      (await User.findByPk(decoded.id)) || (await UserCMS.findByPk(decoded.id));

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "User yang terkait dengan token ini tidak ditemukan.",
      });
    }

    // Simpan data user yang terverifikasi ke req.user untuk digunakan di middleware/rute berikutnya
    req.user = currentUser;

    next(); // Lanjut ke handler berikutnya
  } catch (error) {
    // Error jika token sudah expired atau tidak valid
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "fail",
        message: "Token telah kedaluwarsa. Silakan login kembali.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "fail",
        message: "Token tidak valid. Silakan login kembali.",
      });
    }

    // Tangani error lainnya
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan dalam memproses token.",
      error: error.message, // Opsional: Hapus jika terlalu sensitif
    });
  }
};
