import { Sequelize } from "sequelize";
import UserCMS from "../../model/Members/v02/UserCMS.js";
import VehicleList from "../../model/Members/v02/VehicleList.js";
import MembershipDetail from "../../model/Members/v02/MembershipDetail.js";

export const getTransaksi = async (req, res) => {
    try {
        const userId = req.userId;

        const getUser = await UserCMS.findOne({
            where: { id: userId },
            attributes: ["id", "fullname", "location_code"],
        });

        const result = await VehicleList.findAll({
            attributes: [
                "vehicle_type",
                [Sequelize.fn("COUNT", Sequelize.col("customer_membership.id")), "total"],
            ],

            group: ["vehicle_type"],
        });

        let vehicle_motor = 0;
        let vehicle_mobil = 0;

        result.forEach(item => {
            const type = item.vehicle_type;
            const total = Number(item.get("total"));

            if (type === "MOTOR") vehicle_motor = total;
            if (type === "MOBIL") vehicle_mobil = total;
        });

        return res.status(200).json({
            status: true,
            message: "Get status successfully",
            data: {
                vehicle_motor,
                vehicle_mobil,
            },
        });

    } catch (error) {
        console.log(error);
    }
}