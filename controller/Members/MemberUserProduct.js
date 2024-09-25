import MemberProductBundle from "../../model/Members/MemberProductBundle.js";
import MemberUserProduct from "../../model/Members/MemberUserProduct.js";
import MemberProduct from "../../model/Members/ProductMember.js";
import TrxHistoryMemberProducts from "../../model/Members/TrxHistoryMemberProducts.js";

// Create a new MemberUserProduct
export const createMemberUserProduct = async (req, res) => {
  try {
    const newProduct = await MemberUserProduct.create(req.body);
    res.status(201).json({
      statusCode: 201,
      message: "MemberUserProduct created successfully",
      data: newProduct,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

// Get all MemberUserProducts
export const getAllMemberUserProducts = async (req, res) => {
  try {
    const memberUserProducts = await MemberUserProduct.findAll({
      include: {
        model: TrxHistoryMemberProducts,
        as: "TrxHistories",
        include: {
          model: MemberProduct,
          as: "MemberProduct",
          attributes: ["Id", "LocationName"],
        },
      },
    });
    res.status(200).json({
      statusCode: 200,
      message: "MemberUserProducts retrieved successfully",
      data: memberUserProducts,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

// Get a single MemberUserProduct by ID
export const getMemberUserProduct = async (req, res) => {
  try {
    const product = await MemberUserProduct.findByPk(req.params.id);
    if (!product || product.DeletedOn) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberUserProduct not found",
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: "MemberUserProduct retrieved successfully",
      data: product,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

// Get MemberUserProducts by MemberUserId
export const getMemberByUserId = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing userId query parameter",
      });
    }

    const products = await MemberUserProduct.findAll({
      where: {
        MemberUserId: userId,
      },
      include: {
        model: TrxHistoryMemberProducts,
        as: "TrxHistories",
        include: [
          {
            model: MemberProduct,
            as: "MemberProduct",
            attributes: ["Id", "LocationName", "VehicleType"],
          },
          {
            model: MemberProductBundle,
            as: "ProductBundle", // Alias sesuai dengan yang didefinisikan di asosiasi
            attributes: ["Id", "StartDate", "EndDate", "Price"], // Atribut dari MemberProductBundle yang ingin diambil
          },
        ],
      },
      attributes: ["Id", "CardId", "PlateNumber", "RfId", "IsUsed"],
    });

    if (products.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberUserProduct not found",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "MemberUserProducts retrieved successfully",
      data: products,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

// Update a MemberUserProduct by ID
export const updateMemberUserProduct = async (req, res) => {
  try {
    const [updated] = await MemberUserProduct.update(req.body, {
      where: { Id: req.params.id },
    });
    if (!updated || updated === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberUserProduct not found or already deleted",
      });
    }

    const updatedProduct = await MemberUserProduct.findByPk(req.params.id);
    if (!updatedProduct) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberUserProduct not found",
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: "MemberUserProduct updated successfully",
      data: updatedProduct,
    });
  } catch (err) {
    if (
      err.name === "SequelizeDatabaseError" &&
      err.parent.code === "ER_BAD_FIELD_ERROR"
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid request body",
      });
    }
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

// Soft delete a MemberUserProduct by ID
export const deleteMemberUserProduct = async (req, res) => {
  try {
    const [deleted] = await MemberUserProduct.update(
      {
        DeletedOn: new Date(),
        DeletedBy: req.body.DeletedBy,
      },
      {
        where: { Id: req.params.id, DeletedOn: null },
      }
    );
    if (!deleted) {
      return res.status(404).json({
        statusCode: 404,
        message: "MemberUserProduct not found or already deleted",
      });
    }
    res.status(200).json({
      statusCode: 200,
      message: "MemberUserProduct deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const verifikasiPlat = async (req, res) => {
  try {
    const platNo = req.query.platNo;
    if (!platNo) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing platNo query parameter",
      });
    }
    console.log("platNo");
    const products = await MemberUserProduct.findAll({
      where: {
        PlateNumber: platNo,
      },
    });
    if (products.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "Plat nomor sudah terdaftar",
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "Plat nomor belum terdaftar",
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};
