import { Op } from "sequelize";
import ProviderPayment from "../../model/Members/v02/Provider.js";

export const createProviderPayment = async (req, res) => {
  try {
    const newPayment = await ProviderPayment.create(req.body);
    return res.status(201).json(newPayment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Read all payment providers with pagination and search
export const getAllProviderPayments = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await ProviderPayment.findAndCountAll({
      where: {
        [Op.or]: [
          { partner_key: { [Op.like]: `%${search}%` } },
          { channel_id: { [Op.like]: `%${search}%` } },
          { code_bank: { [Op.like]: `%${search}%` } },
        ],
      },
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Read a single payment provider by ID
export const getProviderPaymentById = async (req, res) => {
  try {
    const payment = await ProviderPayment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment provider not found" });
    }
    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Update a payment provider
export const updateProviderPayment = async (req, res) => {
  try {
    const payment = await ProviderPayment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment provider not found" });
    }
    await payment.update(req.body);
    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete a payment provider
export const deleteProviderPayment = async (req, res) => {
  try {
    const payment = await ProviderPayment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment provider not found" });
    }
    await payment.destroy();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get payment providers by type_payment
export const getByTypePayment = async (req, res) => {
  const { type, locationCode } = req.query;

  try {
    let payments;

    if (locationCode === "004SK") {
      payments = await ProviderPayment.findAll({
        where: { type_payment: type, gateway_partner: "NOBU", is_show: 1 },
      });
      return res.status(200).json(payments);
    } else {
      payments = await ProviderPayment.findAll({
        where: { type_payment: type, is_show: 1 },
      });
      return res.status(200).json(payments);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
