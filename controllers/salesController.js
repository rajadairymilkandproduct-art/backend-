/**
 * MilkSale Controller
 * Business logic for recording and managing sales transactions
 */

import MilkSale from '../models/MilkSale.js';
import { AppError } from '../middleware/errorHandler.js';
import { updateClientOutstanding } from './clientController.js';

/**
 * Get all sales with optional filtering
 * @query {string} [clientId] - Filter by client ID
 * @query {string} [paymentStatus] - Filter by payment status (Paid/Pending)
 * @query {string} [startDate] - Start date for range filter
 * @query {string} [endDate] - End date for range filter
 */
export const getAllSales = async (req, res, next) => {
  try {
    const { clientId, paymentStatus, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (clientId) {
      filter.clientId = clientId;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const sales = await MilkSale.find(filter)
      .populate('clientId', 'name phone city')
      .populate('productId', 'item unit')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MilkSale.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single sale by ID
 */
export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await MilkSale.findById(id)
      .populate('clientId', 'name phone city')
      .populate('productId', 'item unit price');

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a new sale
 */
export const createSale = async (req, res, next) => {
  try {
    const { clientId, product, quantity, unit, pricePerUnit, paymentMethod = 'Credit', notes } = req.body;

    if (!clientId || !product || !quantity || !unit || !pricePerUnit) {
      throw new AppError('Client ID, product, quantity, unit, and price per unit are required', 400);
    }

    if (quantity <= 0 || pricePerUnit <= 0) {
      throw new AppError('Quantity and price must be greater than 0', 400);
    }

    const total = quantity * pricePerUnit;

    // Get client name
    const { default: Client } = await import('../models/Client.js');
    const client = await Client.findById(clientId);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check credit if payment method is credit
    if (paymentMethod === 'Credit' || paymentMethod === 'Pending') {
      if (client.outstandingAmount + total > client.creditLimit) {
        throw new AppError(
          `Insufficient credit. Available: ₹${client.creditLimit - client.outstandingAmount}`,
          400
        );
      }
    }

    const sale = await MilkSale.create({
      clientId,
      clientName: client.name,
      product,
      quantity,
      unit,
      pricePerUnit,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'Paid' : 'Pending',
      notes,
      date: new Date(),
    });

    // Update client outstanding amount if credit/pending
    if (sale.paymentStatus === 'Pending') {
      await updateClientOutstanding(clientId, total, 'add');
    }

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a sale as paid
 */
export const markSaleAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'UPI', reference, paidBy = 'Admin' } = req.body;

    const sale = await MilkSale.findById(id);

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    if (sale.paymentStatus === 'Paid') {
      throw new AppError('Sale is already marked as paid', 400);
    }

    // Update sale
    sale.paymentStatus = 'Paid';
    sale.paymentMethod = paymentMethod;
    if (reference) sale.reference = reference;
    sale.paidAt = new Date();
    sale.paidBy = paidBy;

    await sale.save();

    // Update client outstanding amount
    await updateClientOutstanding(sale.clientId, sale.total, 'subtract');

    res.status(200).json({
      success: true,
      message: 'Payment marked as complete',
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales report by client
 */
export const getSalesByClient = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const sales = await MilkSale.find(filter).populate('clientId', 'name phone city type');

    // Group by client
    const clientSales = {};

    sales.forEach((sale) => {
      const clientId = sale.clientId._id.toString();

      if (!clientSales[clientId]) {
        clientSales[clientId] = {
          clientId: sale.clientId._id,
          clientName: sale.clientId.name,
          clientType: sale.clientId.type,
          totalSales: 0,
          totalQuantity: 0,
          transactionCount: 0,
          paymentStatus: { paid: 0, pending: 0 },
        };
      }

      clientSales[clientId].totalSales += sale.total;
      clientSales[clientId].totalQuantity += sale.quantity;
      clientSales[clientId].transactionCount += 1;

      if (sale.paymentStatus === 'Paid') {
        clientSales[clientId].paymentStatus.paid += sale.total;
      } else {
        clientSales[clientId].paymentStatus.pending += sale.total;
      }
    });

    res.status(200).json({
      success: true,
      count: Object.keys(clientSales).length,
      data: Object.values(clientSales),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales report by product
 */
export const getSalesByProduct = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const sales = await MilkSale.find(filter);

    // Group by product
    const productSales = {};

    sales.forEach((sale) => {
      if (!productSales[sale.product]) {
        productSales[sale.product] = {
          product: sale.product,
          totalQuantitySold: 0,
          totalRevenue: 0,
          transactionCount: 0,
          avgPrice: 0,
        };
      }

      productSales[sale.product].totalQuantitySold += sale.quantity;
      productSales[sale.product].totalRevenue += sale.total;
      productSales[sale.product].transactionCount += 1;
    });

    // Calculate average price
    Object.values(productSales).forEach((product) => {
      product.avgPrice = product.transactionCount > 0
        ? parseFloat((product.totalRevenue / product.transactionCount).toFixed(2))
        : 0;
    });

    res.status(200).json({
      success: true,
      count: Object.keys(productSales).length,
      data: Object.values(productSales),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a sale (only pending sales)
 */
export const deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await MilkSale.findById(id);

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    if (sale.paymentStatus === 'Paid') {
      throw new AppError('Cannot delete a paid sale', 400);
    }

    // Reduce client's outstanding amount
    await updateClientOutstanding(sale.clientId, sale.total, 'subtract');

    await MilkSale.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully',
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};
