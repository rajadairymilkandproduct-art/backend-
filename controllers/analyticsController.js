/**
 * Analytics Controller - Full dashboard + P&L + monthly/daily trends
 */
import MilkCollection from '../models/MilkCollection.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Inventory from '../models/Inventory.js';
import Distributor from '../models/Distributor.js';
import Client from '../models/Client.js';
import MilkSale from '../models/MilkSale.js';
import Production from '../models/Production.js';
import { formatCurrency } from '../utils/pricing.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;

    const [
      todayCollections,
      pendingDistPayments,
      activeDistributors,
      activeClients,
      monthlyCollections,
      monthlyExpenses,
      monthlySales,
      inventoryItems,
      pendingSales,
      lowInventory,
    ] = await Promise.all([
      MilkCollection.find({ date: today }),
      Payment.find({ status: 'Pending' }),
      Distributor.countDocuments({ status: 'Active' }),
      Client.countDocuments({ status: 'Active' }),
      MilkCollection.find({ date: { $gte: monthStart, $lte: today } }),
      Expense.find({ date: { $gte: monthStart, $lte: today } }),
      MilkSale.find({ date: { $gte: new Date(monthStart), $lte: now }, paymentStatus: 'Paid' }),
      Inventory.find({}),
      MilkSale.find({ paymentStatus: 'Pending' }),
      Inventory.find({ status: { $in: ['Low','Critical','Out of Stock'] } }),
    ]);

    const todayTotal   = todayCollections.reduce((s,c) => s+c.quantity, 0);
    const todayRevenue = todayCollections.reduce((s,c) => s+c.total, 0);
    const pendingDistAmt = pendingDistPayments.reduce((s,p) => s+p.amount, 0);
    const monthlyMilkRevenue = monthlyCollections.reduce((s,c) => s+c.total, 0);
    const monthlySalesRevenue = monthlySales.reduce((s,x) => s+x.total, 0);
    const monthlyRevenue = monthlyMilkRevenue + monthlySalesRevenue;
    const totalExpenses  = monthlyExpenses.reduce((s,e) => s+e.amount, 0);
    const netProfit = monthlyRevenue - totalExpenses;
    const pendingSalesAmt = pendingSales.reduce((s,x) => s+x.total, 0);
    const totalInventoryLiters = inventoryItems.filter(i=>i.unit==='L').reduce((s,i)=>s+i.quantity,0);

    res.status(200).json({
      success: true,
      data: {
        todayCollection:    { value: `${todayTotal.toFixed(1)} L`, raw: todayTotal },
        todayRevenue:       { value: formatCurrency(todayRevenue), raw: todayRevenue },
        activeDistributors: { value: activeDistributors, raw: activeDistributors },
        activeClients:      { value: activeClients,      raw: activeClients },
        pendingDistPayments:{ value: formatCurrency(pendingDistAmt), raw: pendingDistAmt },
        pendingSalesAmount: { value: formatCurrency(pendingSalesAmt), raw: pendingSalesAmt },
        monthlyRevenue:     { value: formatCurrency(monthlyRevenue), raw: monthlyRevenue },
        monthlyExpenses:    { value: formatCurrency(totalExpenses), raw: totalExpenses },
        netProfit:          { value: formatCurrency(netProfit), raw: netProfit },
        totalInventory:     { value: `${totalInventoryLiters.toFixed(0)} L`, raw: totalInventoryLiters },
        lowStockAlerts:     { value: lowInventory.length, raw: lowInventory.length },
      },
    });
  } catch (e) { next(e); }
};

export const getMonthlyData = async (req, res, next) => {
  try {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const start = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
      const end   = new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split('T')[0];
      const [collections, expenses, sales] = await Promise.all([
        MilkCollection.find({ date: { $gte: start, $lte: end } }),
        Expense.find({ date: { $gte: start, $lte: end } }),
        MilkSale.find({ date: { $gte: new Date(start), $lte: new Date(end) }, paymentStatus:'Paid' }),
      ]);
      const milkRev  = collections.reduce((s,c)=>s+c.total, 0);
      const salesRev = sales.reduce((s,x)=>s+x.total, 0);
      const revenue  = milkRev + salesRev;
      const exp      = expenses.reduce((s,e)=>s+e.amount, 0);
      months.push({ month: label, revenue, expenses: exp, profit: revenue - exp, milkLiters: collections.reduce((s,c)=>s+c.quantity,0) });
    }
    res.json({ success: true, count: months.length, data: months });
  } catch (e) { next(e); }
};

export const getDailyData = async (req, res, next) => {
  try {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const [collections, sales] = await Promise.all([
        MilkCollection.find({ date: dateStr }),
        MilkSale.find({ date: { $gte: new Date(dateStr), $lt: new Date(dateStr + 'T23:59:59') } }),
      ]);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
        milkCollected: collections.reduce((s,c)=>s+c.quantity,0),
        milkRevenue:   collections.reduce((s,c)=>s+c.total,0),
        salesRevenue:  sales.reduce((s,x)=>s+x.total,0),
      });
    }
    res.json({ success: true, count: days.length, data: days });
  } catch (e) { next(e); }
};

export const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end   = endDate   ? new Date(endDate)   : new Date();
    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];

    const [collections, sales, expenses, payments] = await Promise.all([
      MilkCollection.find({ date: { $gte: startStr, $lte: endStr } }),
      MilkSale.find({ date: { $gte: start, $lte: end } }),
      Expense.find({ date: { $gte: startStr, $lte: endStr } }),
      Payment.find({ status:'Paid', date: { $gte: startStr, $lte: endStr } }),
    ]);

    const milkRevenue  = collections.reduce((s,c)=>s+c.total,0);
    const salesRevenue = sales.reduce((s,x)=>s+x.total,0);
    const totalRevenue = milkRevenue + salesRevenue;
    const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
    const totalPayments = payments.reduce((s,p)=>s+p.amount,0);
    const netProfit = totalRevenue - totalExpenses - totalPayments;

    // Expense breakdown by category
    const expByCategory = {};
    expenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category]||0) + e.amount; });

    res.json({
      success: true,
      data: {
        period: { start: startStr, end: endStr },
        revenue: {
          milk: milkRevenue,
          sales: salesRevenue,
          total: totalRevenue,
        },
        expenses: {
          breakdown: expByCategory,
          operations: totalExpenses,
          distributorPayments: totalPayments,
          total: totalExpenses + totalPayments,
        },
        netProfit,
        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
        counts: {
          collections: collections.length,
          sales: sales.length,
          expenses: expenses.length,
        },
      },
    });
  } catch (e) { next(e); }
};
