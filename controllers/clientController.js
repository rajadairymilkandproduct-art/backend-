/**
 * Client Controller
 * Business logic for client CRUD operations and credit management
 */

import Client from '../models/Client.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all clients with optional filtering and pagination
 * @query {string} [search] - Search by name or city
 * @query {string} [type] - Filter by client type
 * @query {string} [status] - Filter by status (Active/Inactive)
 * @query {string} [city] - Filter by city
 */
export const getAllClients = async (req, res, next) => {
  try {
    const { search, type, status, city, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (type && type.trim()) {
      filter.type = type.trim();
    }

    if (status && status.trim()) {
      filter.status = status.trim();
    }

    if (city && city.trim()) {
      filter.city = city.trim();
    }

    const skip = (page - 1) * limit;

    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Client.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: clients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single client by ID with full details
 */
export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new client
 * Required: name, type, phone, city
 * Optional: email, address, addressLine1, addressLine2, landmark, state, pincode, contactPerson
 */
export const createClient = async (req, res, next) => {
  try {
    const {
      name, type, phone, email,
      address, addressLine1, addressLine2, landmark,
      city, state, pincode,
      contactPerson,
    } = req.body;

    // ✅ creditLimit is no longer required
    if (!name || !type || !phone || !city) {
      throw new AppError('Name, type, phone, and city are required', 400);
    }

    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      throw new AppError('A client with this phone number already exists', 400);
    }

    const client = await Client.create({
      name,
      type,
      phone,
      email,
      // Full address fields
      address,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      contactPerson,
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a client
 */
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, type, phone, email,
      address, addressLine1, addressLine2, landmark,
      city, state, pincode,
      contactPerson, creditLimit, status,
    } = req.body;

    const client = await Client.findById(id);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check for duplicate phone (if changing phone)
    if (phone && phone !== client.phone) {
      const existingClient = await Client.findOne({ phone });
      if (existingClient) {
        throw new AppError('A client with this phone number already exists', 400);
      }
    }

    // Basic fields
    if (name)                        client.name          = name;
    if (type)                        client.type          = type;
    if (phone)                       client.phone         = phone;
    if (email !== undefined)         client.email         = email;
    if (contactPerson !== undefined) client.contactPerson = contactPerson;
    if (creditLimit)                 client.creditLimit   = creditLimit;
    if (status)                      client.status        = status;

    // Address fields
    if (address      !== undefined) client.address      = address;
    if (addressLine1 !== undefined) client.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) client.addressLine2 = addressLine2;
    if (landmark     !== undefined) client.landmark     = landmark;
    if (city)                       client.city         = city;
    if (state        !== undefined) client.state        = state;
    if (pincode      !== undefined) client.pincode      = pincode;

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get credit report for a client
 */
export const getClientCreditReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        clientId:          client._id,
        clientName:        client.name,
        creditLimit:       client.creditLimit,
        outstandingAmount: client.outstandingAmount,
        creditAvailable:   client.creditAvailable,
        creditUtilization: client.creditUtilization,
        totalPurchases:    client.totalPurchases,
        totalAmount:       client.totalAmount,
        lastPurchaseDate:  client.lastPurchaseDate,
        status:            client.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update client's outstanding amount (called when sale is paid/recorded)
 * @internal - Used internally by sales controller
 */
export const updateClientOutstanding = async (clientId, amount, operation = 'add') => {
  try {
    const client = await Client.findById(clientId);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    if (operation === 'add') {
      client.outstandingAmount += amount;
      client.totalAmount       += amount;
    } else if (operation === 'subtract') {
      client.outstandingAmount = Math.max(0, client.outstandingAmount - amount);
    }

    client.lastPurchaseDate = new Date();
    await client.save();

    return client;
  } catch (error) {
    console.error('Error updating client outstanding:', error.message);
    throw error;
  }
};
