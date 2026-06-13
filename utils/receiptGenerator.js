/**
 * Receipt & PDF Generator using PDFKit
 * Generates professional receipts for sales, payments, milk collections
 */

import PDFDocument from 'pdfkit';

const DAIRY_NAME = process.env.DAIRY_NAME || 'DairyFlow Milk Dairy';
const DAIRY_ADDRESS = process.env.DAIRY_ADDRESS || '123 Dairy Road, Village';
const DAIRY_PHONE = process.env.DAIRY_PHONE || '9876543210';
const DAIRY_EMAIL = process.env.DAIRY_EMAIL || 'info@dairyflow.com';
const DAIRY_GST = process.env.DAIRY_GST || '';

/**
 * Format currency
 */
const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Draw a horizontal line
 */
const hLine = (doc, y, color = '#e2e8f0') => {
  doc.strokeColor(color).lineWidth(1).moveTo(40, y).lineTo(560, y).stroke();
};

/**
 * Add page header with dairy branding
 */
const addHeader = (doc, title, subtitle = '') => {
  // Background bar
  doc.rect(0, 0, 600, 90).fill('#1e3a5f');

  // Milk emoji / icon area
  doc.fontSize(28).fillColor('#ffffff').text('🥛', 40, 20);

  // Dairy name
  doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold').text(DAIRY_NAME, 80, 18);
  doc.fontSize(9).fillColor('#93c5fd').font('Helvetica').text(DAIRY_ADDRESS, 80, 40);
  doc.fontSize(9).fillColor('#93c5fd').text(`📞 ${DAIRY_PHONE}   ✉ ${DAIRY_EMAIL}${DAIRY_GST ? `   GST: ${DAIRY_GST}` : ''}`, 80, 53);

  // Title on right
  doc.fontSize(20).fillColor('#ffffff').font('Helvetica-Bold').text(title, 350, 18, { align: 'right', width: 200 });
  if (subtitle) {
    doc.fontSize(10).fillColor('#bfdbfe').font('Helvetica').text(subtitle, 350, 44, { align: 'right', width: 200 });
  }

  doc.y = 110;
  doc.fillColor('#1e293b').font('Helvetica');
};

/**
 * Generate Sale / Invoice Receipt PDF
 */
export const generateSaleReceipt = (sale) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      addHeader(doc, 'SALES INVOICE', `Invoice: ${sale.reference || 'INV-' + sale._id?.toString().slice(-6)}`);

      // Bill To section
      doc.fontSize(11).fillColor('#64748b').font('Helvetica').text('BILL TO:', 40, doc.y);
      doc.fontSize(13).fillColor('#1e293b').font('Helvetica-Bold').text(sale.clientName || 'N/A', 40, doc.y + 2);
      if (sale.clientId?.city) doc.fontSize(10).fillColor('#475569').font('Helvetica').text(sale.clientId.city);
      if (sale.clientId?.phone) doc.fontSize(10).fillColor('#475569').text(`Ph: ${sale.clientId.phone}`);

      // Date & Status on right
      const infoY = 115;
      doc.fontSize(10).fillColor('#64748b').font('Helvetica')
        .text('Date:', 350, infoY)
        .text('Status:', 350, infoY + 16)
        .text('Payment:', 350, infoY + 32);
      doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold')
        .text(fmtDate(sale.date), 410, infoY)
        .text(sale.paymentStatus || 'Pending', 410, infoY + 16, {
          continued: false
        });

      const statusColor = sale.paymentStatus === 'Paid' ? '#16a34a' : '#dc2626';
      doc.fillColor(statusColor).text(sale.paymentStatus || 'Pending', 410, infoY + 16);
      doc.fillColor('#1e293b').text(sale.paymentMethod || 'Credit', 410, infoY + 32);

      doc.y = 175;
      hLine(doc, doc.y);
      doc.y += 8;

      // Table header
      const cols = { item: 40, qty: 270, unit: 330, price: 390, total: 460 };
      doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold')
        .text('PRODUCT / DESCRIPTION', cols.item, doc.y)
        .text('QTY', cols.qty, doc.y)
        .text('UNIT', cols.unit, doc.y)
        .text('RATE', cols.price, doc.y)
        .text('AMOUNT', cols.total, doc.y);

      doc.y += 16;
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 8;

      // Table row
      doc.fontSize(11).fillColor('#1e293b').font('Helvetica')
        .text(sale.product || 'Milk', cols.item, doc.y, { width: 220 })
        .text(String(sale.quantity), cols.qty, doc.y)
        .text(sale.unit || 'L', cols.unit, doc.y)
        .text(fmt(sale.pricePerUnit), cols.price, doc.y)
        .text(fmt(sale.total), cols.total, doc.y);

      doc.y += 30;
      hLine(doc, doc.y);
      doc.y += 10;

      // Total section
      const totalX = 380;
      doc.fontSize(10).fillColor('#64748b').font('Helvetica')
        .text('Sub Total:', totalX, doc.y)
        .text(fmt(sale.total), cols.total, doc.y);
      doc.y += 16;
      doc.fontSize(10).fillColor('#64748b')
        .text('GST (0%):', totalX, doc.y)
        .text(fmt(0), cols.total, doc.y);
      doc.y += 14;
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 8;

      doc.fontSize(14).fillColor('#1e3a5f').font('Helvetica-Bold')
        .text('TOTAL:', totalX, doc.y)
        .text(fmt(sale.total), cols.total, doc.y);

      if (sale.notes) {
        doc.y += 30;
        doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('Notes:');
        doc.fontSize(10).fillColor('#475569').font('Helvetica').text(sale.notes);
      }

      // Footer
      doc.y = 700;
      hLine(doc, doc.y);
      doc.y += 8;
      doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
        .text('Thank you for your business!', 40, doc.y, { align: 'center', width: 520 });
      doc.fontSize(8).fillColor('#94a3b8')
        .text(`Generated on ${new Date().toLocaleString('en-IN')} | ${DAIRY_NAME}`, 40, doc.y + 14, { align: 'center', width: 520 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Payment Receipt PDF
 */
export const generatePaymentReceipt = (payment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      addHeader(doc, 'PAYMENT RECEIPT', `Receipt #: PR-${payment._id?.toString().slice(-8).toUpperCase()}`);

      doc.y = 115;

      // Two-column info
      const leftX = 40, rightX = 310;
      const infoRows = [
        ['Received From:', payment.distributorId?.name || payment.distributorName || 'N/A', 'Date:', fmtDate(payment.date || payment.createdAt)],
        ['Phone:', payment.distributorId?.phone || '-', 'Method:', payment.method || payment.paymentMethod || '-'],
        ['Village:', payment.distributorId?.village || '-', 'Status:', payment.status || 'Paid'],
        ['Period:', payment.period || '-', 'Reference:', payment.reference || '-'],
      ];

      infoRows.forEach(([l1, v1, l2, v2]) => {
        doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(l1, leftX, doc.y);
        doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold').text(v1, leftX + 90, doc.y);
        doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(l2, rightX, doc.y);
        doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold').text(v2, rightX + 90, doc.y);
        doc.y += 18;
      });

      doc.y += 10;
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 20;

      // Big amount
      doc.fontSize(14).fillColor('#64748b').font('Helvetica').text('Amount Paid:', { align: 'center' });
      doc.y += 4;
      doc.fontSize(32).fillColor('#16a34a').font('Helvetica-Bold').text(fmt(payment.amount), { align: 'center' });

      doc.y += 25;
      hLine(doc, doc.y);

      if (payment.notes) {
        doc.y += 12;
        doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold').text('Notes:');
        doc.fontSize(10).fillColor('#475569').font('Helvetica').text(payment.notes);
      }

      doc.y = 700;
      hLine(doc, doc.y);
      doc.y += 8;
      doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
        .text('This is a computer-generated receipt.', 40, doc.y, { align: 'center', width: 520 });
      doc.fontSize(8).fillColor('#94a3b8')
        .text(`Generated on ${new Date().toLocaleString('en-IN')} | ${DAIRY_NAME}`, 40, doc.y + 14, { align: 'center', width: 520 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Milk Collection Receipt
 */
export const generateCollectionReceipt = (collection) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      addHeader(doc, 'COLLECTION RECEIPT', `Date: ${fmtDate(collection.date || new Date())}`);

      doc.y = 115;
      const rows = [
        ['Distributor:', collection.distributorId?.name || collection.distributorName || 'N/A'],
        ['Village:', collection.distributorId?.village || '-'],
        ['Phone:', collection.distributorId?.phone || '-'],
        ['Shift:', collection.shift || 'Morning'],
        ['Fat %:', `${collection.fat || 0}%`],
        ['SNF %:', `${collection.snf || 0}%`],
        ['Quantity:', `${collection.quantity} L`],
        ['Rate/L:', fmt(collection.ratePerLiter)],
        ['Total:', fmt(collection.total)],
      ];

      rows.forEach(([label, value]) => {
        doc.fontSize(10).fillColor('#64748b').font('Helvetica').text(label, 40, doc.y);
        doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(value, 180, doc.y);
        doc.y += 20;
      });

      doc.y += 10;
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 10;

      doc.fontSize(14).fillColor('#1e3a5f').font('Helvetica-Bold')
        .text(`Total Amount: ${fmt(collection.total)}`, 40, doc.y);

      doc.y = 700;
      hLine(doc, doc.y);
      doc.y += 8;
      doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
        .text('Thank you for supplying quality milk!', 40, doc.y, { align: 'center', width: 520 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Profit & Loss Report PDF
 */
export const generateProfitLossReport = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const { startDate, endDate, revenue, expenses, netProfit, breakdown } = data;

      addHeader(doc, 'PROFIT & LOSS', `${fmtDate(startDate)} — ${fmtDate(endDate)}`);

      doc.y = 115;
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 12;

      // Revenue section
      doc.fontSize(13).fillColor('#1e3a5f').font('Helvetica-Bold').text('REVENUE', 40, doc.y);
      doc.y += 16;

      if (breakdown?.revenue) {
        breakdown.revenue.forEach(({ label, amount }) => {
          doc.fontSize(10).fillColor('#475569').font('Helvetica').text(label, 60, doc.y);
          doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold').text(fmt(amount), 400, doc.y, { align: 'right', width: 160 });
          doc.y += 16;
        });
      }
      hLine(doc, doc.y);
      doc.y += 6;
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text('Total Revenue:', 60, doc.y);
      doc.fontSize(12).fillColor('#16a34a').font('Helvetica-Bold').text(fmt(revenue), 400, doc.y, { align: 'right', width: 160 });
      doc.y += 25;

      // Expenses section
      doc.fontSize(13).fillColor('#1e3a5f').font('Helvetica-Bold').text('EXPENSES', 40, doc.y);
      doc.y += 16;

      if (breakdown?.expenses) {
        breakdown.expenses.forEach(({ label, amount }) => {
          doc.fontSize(10).fillColor('#475569').font('Helvetica').text(label, 60, doc.y);
          doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold').text(fmt(amount), 400, doc.y, { align: 'right', width: 160 });
          doc.y += 16;
        });
      }
      hLine(doc, doc.y);
      doc.y += 6;
      doc.fontSize(12).fillColor('#dc2626').font('Helvetica-Bold').text('Total Expenses:', 60, doc.y);
      doc.fontSize(12).fillColor('#dc2626').font('Helvetica-Bold').text(fmt(expenses), 400, doc.y, { align: 'right', width: 160 });
      doc.y += 25;

      // Net Profit
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 10;
      const profitColor = netProfit >= 0 ? '#16a34a' : '#dc2626';
      doc.fontSize(16).fillColor(profitColor).font('Helvetica-Bold').text('NET PROFIT / LOSS:', 40, doc.y);
      doc.fontSize(16).fillColor(profitColor).font('Helvetica-Bold').text(fmt(netProfit), 350, doc.y, { align: 'right', width: 210 });

      doc.y = 700;
      hLine(doc, doc.y);
      doc.y += 8;
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
        .text(`Generated on ${new Date().toLocaleString('en-IN')} | ${DAIRY_NAME}`, 40, doc.y, { align: 'center', width: 520 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Inventory Report PDF
 */
export const generateInventoryReport = (items) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      addHeader(doc, 'INVENTORY REPORT', `As of ${fmtDate(new Date())}`);

      doc.y = 115;

      const cols = { item: 40, cat: 170, qty: 290, cap: 350, loc: 410, status: 490 };
      doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold')
        .text('ITEM', cols.item)
        .text('CATEGORY', cols.cat, doc.y - 10)
        .text('QTY', cols.qty, doc.y - 10)
        .text('CAP', cols.cap, doc.y - 10)
        .text('LOCATION', cols.loc, doc.y - 10)
        .text('STATUS', cols.status, doc.y - 10);

      doc.y += 4;
      hLine(doc, doc.y, '#1e3a5f');
      doc.y += 6;

      const statusColors = { Good: '#16a34a', Low: '#d97706', Critical: '#dc2626', 'Out of Stock': '#7f1d1d' };

      items.forEach((item, i) => {
        if (i % 2 === 0) {
          doc.rect(40, doc.y - 2, 520, 18).fill('#f8fafc');
        }
        const sc = statusColors[item.status] || '#64748b';
        doc.fontSize(9).fillColor('#1e293b').font('Helvetica')
          .text(item.item, cols.item, doc.y, { width: 120 })
          .text(item.category, cols.cat, doc.y, { width: 110 })
          .text(`${item.quantity} ${item.unit}`, cols.qty, doc.y)
          .text(`${item.capacity} ${item.unit}`, cols.cap, doc.y)
          .text(item.location || '-', cols.loc, doc.y, { width: 70 });
        doc.fontSize(9).fillColor(sc).font('Helvetica-Bold').text(item.status, cols.status, doc.y);
        doc.fillColor('#1e293b');
        doc.y += 18;

        if (doc.y > 700) {
          doc.addPage();
          doc.y = 40;
        }
      });

      doc.y += 10;
      hLine(doc, doc.y);
      doc.y += 8;
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
        .text(`Total Items: ${items.length}  |  Generated on ${new Date().toLocaleString('en-IN')} | ${DAIRY_NAME}`, 40, doc.y, { align: 'center', width: 520 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
