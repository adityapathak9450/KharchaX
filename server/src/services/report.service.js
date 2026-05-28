import Transaction from '../models/Transaction.model.js';
import Report from '../models/Report.model.js';
import RecurringPayment from '../models/RecurringPayment.model.js';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// =======================
// CLOUDINARY CONFIG
// =======================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// DESIGN SYSTEM
// =======================

const COLORS = {
  primary:   '#6366f1',
  primary2:  '#818cf8',
  success:   '#22c55e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  dark:      '#0f172a',
  darkCard:  '#1e293b',
  gray:      '#64748b',
  lightGray: '#94a3b8',
  light:     '#f8fafc',
  white:     '#ffffff',
  border:    '#e2e8f0',
};

// Category color palette for variety
const CAT_COLORS = [
  '#6366f1','#22c55e','#ef4444','#f59e0b',
  '#06b6d4','#ec4899','#8b5cf6','#14b8a6',
  '#f97316','#84cc16',
];

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const getMonthName = (month) => {
  const names = ['Jan','Feb','Mar','Apr','May','Jun',
                 'Jul','Aug','Sep','Oct','Nov','Dec'];
  return names[(month || 1) - 1];
};

// =======================
// DRAW HELPERS
// =======================

const drawSectionTitle = (doc, title, y) => {
  doc.fontSize(18).fillColor(COLORS.primary).text(title, 50, y);
  // Underline
  doc.moveTo(50, y + 24).lineTo(545, y + 24)
    .strokeColor('#e2e8f0').lineWidth(1).stroke();
  return y + 38;
};

const drawMetricCard = (doc, x, y, width, height, title, value, sub, color) => {
  doc.roundedRect(x, y, width, height, 10).fill(color);
  doc.fillColor('rgba(255,255,255,0.15)').roundedRect(x, y, width, 6, 3).fill();
  doc.fillColor(COLORS.white).fontSize(10).text(title, x + 12, y + 14);
  doc.fontSize(18).font('Helvetica-Bold').text(value, x + 12, y + 30);
  if (sub) doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)').text(sub, x + 12, y + 54);
  doc.font('Helvetica');
};

const drawProgressBar = (doc, x, y, width, height, pct, color, bgColor) => {
  doc.roundedRect(x, y, width, height, height / 2).fill(bgColor || '#e2e8f0');
  const fill = Math.max(Math.min(pct, 100), 0);
  if (fill > 0) {
    doc.roundedRect(x, y, (fill / 100) * width, height, height / 2).fill(color);
  }
};

const drawTag = (doc, x, y, text, bgColor, textColor) => {
  const w = doc.fontSize(9).widthOfString(text) + 16;
  doc.roundedRect(x, y, w, 18, 9).fill(bgColor);
  doc.fillColor(textColor || COLORS.white).fontSize(9).text(text, x + 8, y + 4);
  return x + w + 6;
};

const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

// =======================
// MAIN REPORT GENERATOR
// =======================

const generateReport = async (reportId, userId, options) => {
  try {
    const { type, month, year, format,skipStatusUpdate  } = options;

    if (!skipStatusUpdate) {
      await Report.findByIdAndUpdate(reportId, { status: 'pending' });
    }

    await Report.findByIdAndUpdate(reportId, { status: 'pending' });

    let reportData;
    if (type === 'monthly') {
      reportData = await generateMonthlyReportData(userId, month, year);
    } else if (type === 'yearly') {
      reportData = await generateYearlyReportData(userId, year);
    } else {
      reportData = await generateMonthlyReportData(userId, month, year);
    }

    const fileName = `${type}-report-${Date.now()}`;

    let fileUrl   = null;
    let pdfBuffer = null;

    if (format === 'csv') {
      fileUrl = await generateCSV(reportData, fileName);
    } else {
      pdfBuffer = await generatePDF(reportData, fileName);
    }

    await Report.findByIdAndUpdate(reportId, {
      status: 'ready',
      fileUrl: fileUrl || null,
      generatedAt: new Date(),
    });

    return { reportId, fileUrl, pdfBuffer, type, format };

  } catch (error) {
    await Report.findByIdAndUpdate(reportId, {
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
};

// =======================
// MONTHLY DATA
// =======================

const generateMonthlyReportData = async (userId, month, year) => {
  const currentDate  = new Date();
  const targetMonth  = month ? parseInt(month) : currentDate.getMonth() + 1;
  const targetYear   = year  ? parseInt(year)  : currentDate.getFullYear();
  const { start, end } = getMonthRange(targetMonth, targetYear);

  // ── FIX: convert userId string → ObjectId for aggregations ──
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const allTransactions = await Transaction.find({
    userId,
    date: { $gte: start, $lte: end },
  })
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')
    .sort({ date: -1 });

  const recurringPayments = await RecurringPayment.find({ userId, isActive: true });

  const totals = allTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0, savings: 0 }
  );
  totals.savings = totals.income - totals.expense;

  // ── Category breakdown (fixed ObjectId) ──
  const categoryBreakdown = await Transaction.aggregate([
    { $match: { userId: userObjectId, type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { name: '$category.name', color: '$category.color', total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);

  // ── Wallet breakdown (fixed ObjectId) ──
  const walletBreakdown = await Transaction.aggregate([
    { $match: { userId: userObjectId, date: { $gte: start, $lte: end } } },
    { $group: { _id: '$wallet', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'wallets', localField: '_id', foreignField: '_id', as: 'wallet' } },
    { $unwind: '$wallet' },
    { $project: { name: '$wallet.name', type: '$wallet.type', total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);

  // ── Daily spending trend ──
  const dailyTrend = await Transaction.aggregate([
    { $match: { userId: userObjectId, type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: { day: { $dayOfMonth: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { '_id.day': 1 } },
  ]);

  // ── Top 5 biggest single expenses ──
  const topExpenses = allTransactions
    .filter(tx => tx.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // ── Financial Health Score ──
  let financialScore = 0;
  if (totals.income > 0) {
    const r = (totals.savings / totals.income) * 100;
    if (r >= 40) financialScore = 95;
    else if (r >= 25) financialScore = 80;
    else if (r >= 10) financialScore = 65;
    else financialScore = 40;
  }

  return {
    period: { month: targetMonth, year: targetYear },
    allTransactions,
    totals,
    categoryBreakdown,
    walletBreakdown,
    dailyTrend,
    topExpenses,
    financialScore,
    recurringPayments,
    transactionCount: allTransactions.length,
  };
};

// =======================
// YEARLY DATA
// =======================

const generateYearlyReportData = async (userId, year) =>
  generateMonthlyReportData(userId, null, year);

// =======================
// CSV GENERATOR
// =======================

const generateCSV = async (reportData, fileName) => {
  const { allTransactions } = reportData;
  let csv = 'Date,Type,Category,Wallet,Amount\n';
  allTransactions.forEach((tx) => {
    csv += `${new Date(tx.date).toLocaleDateString()},${tx.type},${
      tx.category?.name || 'Unknown'
    },${tx.wallet?.name || 'Unknown'},${tx.amount}\n`;
  });
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'kharchaX/reports', public_id: fileName, format: 'csv' },
      (error, result) => { if (error) reject(error); else resolve(result.secure_url); }
    );
    uploadStream.end(csv);
  });
};

// =======================
// PDF GENERATOR
// =======================

const generatePDF = async (reportData) => {
  const {
    allTransactions, totals, period,
    categoryBreakdown, walletBreakdown,
    dailyTrend, topExpenses,
    financialScore, recurringPayments,
  } = reportData;

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PW = 595; // A4 width pts
    const PH = 842; // A4 height pts

    // ================================================
    // PAGE 1 — COVER
    // ================================================

    // Dark gradient background
    doc.rect(0, 0, PW, PH).fill(COLORS.dark);

    // Accent top bar
    doc.rect(0, 0, PW, 6).fill(COLORS.primary);

    // Decorative circle top-right
    doc.circle(PW - 60, 80, 120).fillOpacity(0.06).fill(COLORS.primary2);
    doc.circle(PW - 20, 160, 60).fillOpacity(0.08).fill(COLORS.primary).fillOpacity(1);

    // Logo area
    doc.roundedRect(50, 80, 48, 48, 10).fill(COLORS.primary);
    doc.fillColor(COLORS.white).fontSize(22).font('Helvetica-Bold').text('K', 62, 92);

    doc.font('Helvetica-Bold').fontSize(32).fillColor(COLORS.white)
      .text('KharchaX', 110, 88);
    doc.font('Helvetica').fontSize(12).fillColor(COLORS.primary2)
      .text('AI Financial Intelligence Platform', 110, 126);

    // Divider
    doc.moveTo(50, 160).lineTo(PW - 50, 160)
      .strokeColor(COLORS.primary).lineWidth(2).stroke();

    // Report title
    doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.white)
      .text('Financial Analytics Report', 50, 190);

    const periodStr = period.month
      ? `${getMonthName(period.month)} ${period.year}`
      : `Year ${period.year}`;

    doc.font('Helvetica').fontSize(16).fillColor(COLORS.lightGray)
      .text(`Period: ${periodStr}`, 50, 235);

    doc.fontSize(12).fillColor(COLORS.gray)
      .text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 50, 260);

    // Summary cards on cover
    const coverCardY = 320;
    const coverCardW = 145;
    const coverCardH = 90;

    drawMetricCard(doc, 50,  coverCardY, coverCardW, coverCardH,
      'Total Income', formatCurrency(totals.income),
      `${allTransactions.filter(t=>t.type==='income').length} transactions`,
      COLORS.success);

    drawMetricCard(doc, 210, coverCardY, coverCardW, coverCardH,
      'Total Expenses', formatCurrency(totals.expense),
      `${allTransactions.filter(t=>t.type==='expense').length} transactions`,
      COLORS.danger);

    drawMetricCard(doc, 370, coverCardY, coverCardW, coverCardH,
      'Net Savings', formatCurrency(totals.savings),
      totals.income > 0
        ? `${((totals.savings/totals.income)*100).toFixed(1)}% savings rate`
        : '—',
      COLORS.primary);

    // Health score on cover
    const scoreY = 450;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white)
      .text('Financial Health Score', 50, scoreY);

    drawProgressBar(doc, 50, scoreY + 24, 495, 16, financialScore, COLORS.primary, '#1e293b');

    const scoreLabel = financialScore >= 80 ? 'Excellent 🎯'
      : financialScore >= 65 ? 'Good 👍'
      : financialScore >= 40 ? 'Fair ⚠️'
      : 'Needs Attention ❗';

    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.primary2)
      .text(`${financialScore}/100`, 50, scoreY + 50);
    doc.font('Helvetica').fontSize(12).fillColor(COLORS.lightGray)
      .text(scoreLabel, 130, scoreY + 54);

    // AI Insight blurb on cover
    const insightY = 540;
    doc.roundedRect(50, insightY, 495, 80, 10).fill(COLORS.darkCard);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.primary2)
      .text('AI INSIGHT', 66, insightY + 14);

    const insight = totals.savings > 0
      ? `You saved ${((totals.savings/totals.income)*100).toFixed(1)}% of your income — that's ${
          financialScore >= 80 ? 'outstanding' : 'good'} financial discipline. Your top expense category is ${
          categoryBreakdown[0]?.name || 'unknown'}.`
      : `Your expenses exceeded income by ${formatCurrency(Math.abs(totals.savings))} this period. Focus on reducing discretionary spending.`;

    doc.font('Helvetica').fontSize(11).fillColor(COLORS.lightGray)
      .text(insight, 66, insightY + 30, { width: 463 });

    // Footer on cover
    doc.fontSize(9).fillColor(COLORS.gray)
      .text('Confidential — Generated by KharchaX AI Financial Intelligence Platform',
        50, PH - 40, { align: 'center', width: 495 });

    // ================================================
    // PAGE 2 — CATEGORY ANALYTICS
    // ================================================

    doc.addPage();
    doc.rect(0, 0, PW, PH).fill(COLORS.white);
    doc.rect(0, 0, PW, 6).fill(COLORS.primary);

    let cy = 30;

    doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray)
      .text(periodStr, PW - 160, cy + 4, { align: 'right', width: 110 });

    cy = drawSectionTitle(doc, 'Category Spending Breakdown', cy);

    if (categoryBreakdown.length === 0) {
      doc.roundedRect(50, cy, 495, 60, 8).fill('#f1f5f9');
      doc.font('Helvetica').fontSize(13).fillColor(COLORS.gray)
        .text('No expense transactions found for this period.', 70, cy + 22);
      cy += 80;
    } else {
      const totalExp = categoryBreakdown.reduce((s, c) => s + c.total, 0);

      categoryBreakdown.forEach((cat, i) => {
        const pct = totalExp > 0 ? (cat.total / totalExp) * 100 : 0;
        const color = CAT_COLORS[i % CAT_COLORS.length];

        // Row background
        if (i % 2 === 0) doc.rect(45, cy - 4, 505, 52).fill('#f8fafc');

        // Color dot
        doc.circle(62, cy + 14, 7).fill(color);

        // Category name
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.dark)
          .text(cat.name, 78, cy + 4);
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray)
          .text(`${cat.count} transaction${cat.count !== 1 ? 's' : ''}`, 78, cy + 19);

        // Amount + pct
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.dark)
          .text(formatCurrency(cat.total), 390, cy + 4, { align: 'right', width: 110 });
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray)
          .text(`${pct.toFixed(1)}%`, 390, cy + 19, { align: 'right', width: 110 });

        // Progress bar
        drawProgressBar(doc, 78, cy + 34, 420, 8, pct, color, '#e2e8f0');

        cy += 56;

        if (cy > 760) {
          doc.addPage();
          doc.rect(0, 0, PW, PH).fill(COLORS.white);
          doc.rect(0, 0, PW, 6).fill(COLORS.primary);
          cy = 30;
          cy = drawSectionTitle(doc, 'Category Spending (continued)', cy);
        }
      });

      // Total row
      cy += 6;
      doc.rect(45, cy, 505, 28).fill(COLORS.primary);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
        .text('Total Expenses', 78, cy + 8);
      doc.text(formatCurrency(totalExp), 390, cy + 8, { align: 'right', width: 110 });
      cy += 40;
    }

    // ── Top 5 Biggest Expenses ──
    if (topExpenses.length > 0 && cy < 680) {
      cy += 10;
      cy = drawSectionTitle(doc, 'Top 5 Biggest Expenses', cy);

      topExpenses.forEach((tx, i) => {
        doc.roundedRect(45, cy, 505, 34, 6)
          .fill(i === 0 ? '#fef2f2' : '#f8fafc');

        // Rank badge
        doc.circle(68, cy + 17, 11).fill(i === 0 ? COLORS.danger : COLORS.gray);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
          .text(`${i+1}`, 64, cy + 12);

        doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark)
          .text(tx.category?.name || 'Unknown', 86, cy + 6);
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray)
          .text(new Date(tx.date).toLocaleDateString('en-IN'), 86, cy + 19);

        doc.font('Helvetica-Bold').fontSize(13)
          .fillColor(i === 0 ? COLORS.danger : COLORS.dark)
          .text(formatCurrency(tx.amount), 390, cy + 10, { align: 'right', width: 110 });

        cy += 40;
      });
    }

    // ================================================
    // PAGE 3 — WALLET + RECURRING + DAILY TREND
    // ================================================

    doc.addPage();
    doc.rect(0, 0, PW, PH).fill(COLORS.white);
    doc.rect(0, 0, PW, 6).fill(COLORS.primary);

    cy = 30;

    // ── Wallet Analytics ──
    cy = drawSectionTitle(doc, 'Wallet Usage Analytics', cy);

    if (!walletBreakdown || walletBreakdown.length === 0) {
      doc.roundedRect(50, cy, 495, 50, 8).fill('#f1f5f9');
      doc.font('Helvetica').fontSize(12).fillColor(COLORS.gray)
        .text('No wallet data found for this period.', 70, cy + 18);
      cy += 70;
    } else {
      const maxWallet = Math.max(...walletBreakdown.map(w => w.total));

      walletBreakdown.forEach((wallet, i) => {
        const pct = maxWallet > 0 ? (wallet.total / maxWallet) * 100 : 0;
        const color = CAT_COLORS[(i + 4) % CAT_COLORS.length];

        if (i % 2 === 0) doc.rect(45, cy - 4, 505, 44).fill('#f8fafc');

        doc.circle(62, cy + 14, 7).fill(color);

        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.dark)
          .text(wallet.name, 78, cy + 4);
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray)
          .text(`${wallet.count} transaction${wallet.count !== 1 ? 's' : ''}`, 78, cy + 19);

        doc.font('Helvetica-Bold').fontSize(12).fillColor(color)
          .text(formatCurrency(wallet.total), 390, cy + 10, { align: 'right', width: 110 });

        drawProgressBar(doc, 78, cy + 32, 420, 6, pct, color, '#e2e8f0');
        cy += 48;
      });
    }

    // ── Recurring Payments ──
    cy += 14;
    cy = drawSectionTitle(doc, 'Active Recurring Payments', cy);

    if (!recurringPayments || recurringPayments.length === 0) {
      doc.roundedRect(50, cy, 495, 50, 8).fill('#f1f5f9');
      doc.font('Helvetica').fontSize(12).fillColor(COLORS.gray)
        .text('No active recurring payments.', 70, cy + 18);
      cy += 70;
    } else {
      const recurTotal = recurringPayments.reduce((s, p) => s + (p.amount || 0), 0);

      recurringPayments.forEach((payment, i) => {
        if (i % 2 === 0) doc.rect(45, cy - 4, 505, 34).fill('#f8fafc');

        // Name — try .name, .title, fallback
        const pName = payment.name || payment.title || 'Recurring Payment';
        const pFreq = payment.frequency || payment.cycle || 'monthly';

        doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.dark)
          .text(pName, 60, cy + 6);

        drawTag(doc, 220, cy + 6, pFreq.toUpperCase(), COLORS.primary + '22', COLORS.primary);

        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.danger)
          .text(formatCurrency(payment.amount), 390, cy + 6, { align: 'right', width: 110 });

        cy += 38;
      });

      // Total recurring
      doc.rect(45, cy, 505, 28).fill('#fef2f2');
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.danger)
        .text('Total Monthly Commitments', 60, cy + 8);
      doc.text(formatCurrency(recurTotal), 390, cy + 8, { align: 'right', width: 110 });
      cy += 40;
    }

    // ── Daily Spending Trend (ASCII bar chart) ──
    if (dailyTrend && dailyTrend.length > 0 && cy < 620) {
      cy += 14;
      cy = drawSectionTitle(doc, 'Daily Spending Trend', cy);

      const maxDaily = Math.max(...dailyTrend.map(d => d.total));
      const barH     = 60;  // chart height
      const chartW   = 495;
      const barW     = Math.min(Math.floor(chartW / dailyTrend.length) - 2, 20);

      // Chart background
      doc.roundedRect(45, cy, chartW + 10, barH + 30, 8).fill('#f8fafc');

      dailyTrend.forEach((d, i) => {
        const x      = 50 + i * (barW + 2);
        const pct    = maxDaily > 0 ? d.total / maxDaily : 0;
        const fillH  = Math.max(pct * barH, 2);
        const barY   = cy + barH - fillH + 4;

        doc.roundedRect(x, barY, barW, fillH, 2)
          .fill(pct > 0.8 ? COLORS.danger : pct > 0.5 ? COLORS.warning : COLORS.primary);

        // Day label (only every 5 days to avoid overlap)
        if (d._id.day % 5 === 0 || d._id.day === 1) {
          doc.font('Helvetica').fontSize(7).fillColor(COLORS.gray)
            .text(`${d._id.day}`, x - 1, cy + barH + 8, { width: barW + 4, align: 'center' });
        }
      });

      doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray)
        .text('Day of month →', 50, cy + barH + 20);

      cy += barH + 40;
    }

    // ================================================
    // PAGE 4 — TRANSACTIONS TABLE
    // ================================================

    doc.addPage();
    doc.rect(0, 0, PW, PH).fill(COLORS.white);
    doc.rect(0, 0, PW, 6).fill(COLORS.primary);

    cy = 30;
    cy = drawSectionTitle(doc, `Recent Transactions (${Math.min(allTransactions.length, 30)} shown)`, cy);

    // Table header
    doc.rect(45, cy, 505, 26).fill(COLORS.dark);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);
    doc.text('Date',      55,  cy + 8);
    doc.text('Category',  150, cy + 8);
    doc.text('Wallet',    280, cy + 8);
    doc.text('Type',      370, cy + 8);
    doc.text('Amount',    440, cy + 8, { align: 'right', width: 100 });
    cy += 28;

    if (allTransactions.length === 0) {
      doc.font('Helvetica').fontSize(12).fillColor(COLORS.gray)
        .text('No transactions for this period.', 60, cy + 10);
    } else {
      allTransactions.slice(0, 30).forEach((tx, i) => {
        if (cy > 800) {
          doc.addPage();
          doc.rect(0, 0, PW, PH).fill(COLORS.white);
          doc.rect(0, 0, PW, 6).fill(COLORS.primary);
          cy = 30;
          doc.rect(45, cy, 505, 26).fill(COLORS.dark);
          doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);
          doc.text('Date', 55, cy + 8);
          doc.text('Category', 150, cy + 8);
          doc.text('Wallet', 280, cy + 8);
          doc.text('Type', 370, cy + 8);
          doc.text('Amount', 440, cy + 8, { align: 'right', width: 100 });
          cy += 28;
        }

        doc.rect(45, cy, 505, 24)
          .fill(i % 2 === 0 ? '#f8fafc' : COLORS.white);

        doc.font('Helvetica').fontSize(9).fillColor(COLORS.dark);
        doc.text(new Date(tx.date).toLocaleDateString('en-IN'), 55, cy + 7);
        doc.text((tx.category?.name || 'Unknown').substring(0, 14), 150, cy + 7);
        doc.text((tx.wallet?.name  || 'Unknown').substring(0, 12), 280, cy + 7);

        const isIncome = tx.type === 'income';
        doc.font('Helvetica-Bold').fontSize(9)
          .fillColor(isIncome ? COLORS.success : COLORS.danger)
          .text(tx.type.toUpperCase(), 370, cy + 7);

        doc.font('Helvetica-Bold').fontSize(9)
          .fillColor(isIncome ? COLORS.success : COLORS.dark)
          .text(formatCurrency(tx.amount), 440, cy + 7, { align: 'right', width: 100 });

        cy += 24;
      });
    }

    // ================================================
    // PAGE 5 — CLOSING / AI INSIGHTS
    // ================================================

    doc.addPage();
    doc.rect(0, 0, PW, PH).fill(COLORS.dark);
    doc.rect(0, 0, PW, 6).fill(COLORS.primary);

    // Decorative circles
    doc.circle(PW - 80, 200, 150).fillOpacity(0.05).fill(COLORS.primary2);
    doc.circle(80, PH - 150, 120).fillOpacity(0.05).fill(COLORS.success).fillOpacity(1);

    doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.white)
      .text('Your Financial Summary', 50, 80);

    doc.font('Helvetica').fontSize(13).fillColor(COLORS.lightGray)
      .text(periodStr, 50, 118);

    // Three insight boxes
    const iBoxes = [
      {
        title: 'Savings Performance',
        body: totals.savings > 0
          ? `You kept ₹${totals.savings.toLocaleString('en-IN', {maximumFractionDigits:0})} this month. ${financialScore >= 80 ? 'Exceptional work!' : 'Keep building!'}`
          : `Deficit of ${formatCurrency(Math.abs(totals.savings))}. Review your spending habits.`,
        color: totals.savings > 0 ? COLORS.success : COLORS.danger,
      },
      {
        title: 'Spending Pattern',
        body: categoryBreakdown[0]
          ? `Your biggest spend is ${categoryBreakdown[0].name} at ${formatCurrency(categoryBreakdown[0].total)}${
              totals.expense > 0 ? ` (${((categoryBreakdown[0].total/totals.expense)*100).toFixed(0)}% of expenses)` : ''}.`
          : 'No expense data recorded this period.',
        color: COLORS.warning,
      },
      {
        title: 'Recurring Load',
        body: recurringPayments.length > 0
          ? `You have ${recurringPayments.length} active recurring payment${recurringPayments.length!==1?'s':''} totalling ${formatCurrency(recurringPayments.reduce((s,p)=>s+(p.amount||0),0))}/month.`
          : 'No recurring payments active.',
        color: COLORS.primary,
      },
    ];

    let iY = 160;
    iBoxes.forEach((box) => {
      doc.roundedRect(50, iY, 495, 80, 10).fill(COLORS.darkCard);
      doc.rect(50, iY, 4, 80).fill(box.color);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(box.color)
        .text(box.title, 66, iY + 14);
      doc.font('Helvetica').fontSize(11).fillColor(COLORS.lightGray)
        .text(box.body, 66, iY + 34, { width: 460 });
      iY += 96;
    });

    // Score recap
    iY += 10;
    doc.roundedRect(50, iY, 495, 60, 10).fill(COLORS.darkCard);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.primary2)
      .text('Financial Health Score', 66, iY + 12);
    drawProgressBar(doc, 66, iY + 36, 460, 12, financialScore, COLORS.primary, '#334155');
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
      .text(`${financialScore}/100`, 66, iY + 54);

    // Footer
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray)
      .text(
        `Generated by KharchaX — AI Financial Intelligence Platform  •  ${new Date().toLocaleDateString('en-IN')}`,
        50, PH - 40, { align: 'center', width: 495 }
      );

    doc.end();
  });
};

export { generateReport };