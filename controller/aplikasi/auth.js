import { Op } from "sequelize";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import { MemberUserRole } from "../../model/Master/RoleModel.js";
import { createTokenAplikasi } from "../../config/ConfigToken.js";
import bcrypt from "bcryptjs/dist/bcrypt.js";
import LocationArea from "../../model/Members/v02/LocationMaster.js";
import MembershipCard from "../../model/Members/v02/MembershipCard.js";
import MasterCard from "../../model/Members/v02/MasterCard.js";

export const loginAplikasi = async (req, res) => {
    const { username, password, rememberMe = false } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            status: "fail",
            message:
                "Harap masukkan identifier (username, email, atau nomor telepon) dan password.",
        });
    }

    try {
        // Cari user di database User
        const user = await UserCMS.findOne({
            where: {
                [Op.or]: [{ username: username }, { phone_number: username }],
            },
            include: [
                {
                    model: MemberUserRole,
                },
            ],
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
        createTokenAplikasi(user, 200, res, rememberMe);
    } catch (error) {
        // Tangani error lainnya
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
            error: error.message, // Opsional: Hapus di produksi jika terlalu sensitif
        });
    }
};

export const getProfil = async (req, res) => {
    try {
        const userId = req.userId;

        const userById = await UserCMS.findOne({
            where: { id: userId },
            attributes: ["id", "fullname", "email", "location_code"],
        });

        const findLocation = await LocationArea.findOne({
            where: { location_code: userById.location_code },
            attributes: ["location_name"]
        });

        const response = {
            "name": userById.fullname,
            "locationName": findLocation.location_name,
            "email": userById.email,
        }

        return res.status(200).json({
            status: "success",
            message: "Get profil successfully",
            data: response,
        })
    } catch (error) {
        console.log(error);
    }
}

export const getCardByLocation = async (req, res) => {
    try {
        const userId = req.userId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const userById = await UserCMS.findOne({
            where: { id: userId },
            attributes: ["id", "fullname", "email", "location_code"],
        });

        if (!userById) {
            return res.status(404).json({
                status: "error",
                message: "User tidak ditemukan",
            });
        }

        const { rows, count } = await MasterCard.findAndCountAll({
            where: { location_code: userById.location_code },
            attributes: ["location_name", "card_type", "is_active"],
            limit,
            offset,
            order: [["updated_at", "DESC"]],
        });

        return res.status(200).json({
            status: "success",
            message: "Get profil successfully",
            data: rows,
            pagination: {
                totalData: count,
                totalPage: Math.ceil(count / limit),
                currentPage: page,
                limit,
            },
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

export const logoutAplikasi = (req, res) => {
    res.clearCookie("refreshToken");
    res.cookie("refreshToken", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "strict",
        // domain: ".skyparking.online",
    });

    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
};


