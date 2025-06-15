import jwt from "jsonwebtoken";
import User from "../../model/Members/Users.js";
import UserCMS from "../../model/Members/v02/UserCMS.js";

export const protect = async (req, res, next) => {
  let token;

  // Pastikan Anda menggunakan nama cookie yang benar ('refreshToken' dalam hal ini)
  if (req.cookies.refreshToken) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    
    req.userId = decoded.id;
    // Cari user berdasarkan ID yang ada di token
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    // Simpan data user yang terverifikasi ke req.user untuk digunakan di rute selanjutnya
    req.user = currentUser;
    next(); // Lanjut ke handler berikutnya
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token or token has expired.",
    });
  }
};
