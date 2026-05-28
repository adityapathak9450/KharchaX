import Transaction from '../models/Transaction.model.js';
import Category from '../models/Category.model.js';
import Report from '../models/Report.model.js';
import RecurringPayment from '../models/RecurringPayment.model.js';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';

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
  primary: '#6366f1',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#0f172a',
  gray: '#64748b',
  light: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
};

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
};

// =======================
// HELPER FUNCTIONS
// =======================

const drawSectionTitle = (doc, title, y) => {
  doc.fontSize(20).fillColor(COLORS.primary).text(title, 50, y);
  return y + 35;
};

const drawMetricCard = (doc, x, y, width, height, title, value, color) => {
  doc.roundedRect(x, y, width, height, 12).fill(color);
  doc.fillColor(COLORS.white).fontSize(12).text(title, x + 15, y + 15);
  doc.fontSize(20).text(value, x + 15, y + 40);
};

const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

// =======================
// MAIN REPORT GENERATOR
// =======================

const generateReport = async (reportId, userId, options) => {
  try {
    const { type, month, year, format } = options;

    // Use 'pending' during generation (schema only allows pending/ready/failed)
    await Report.findByIdAndUpdate(reportId, {
      status: 'pending',
    });

    let reportData;

    if (type === 'monthly') {
      reportData = await generateMonthlyReportData(userId, month, year);
    } else if (type === 'yearly') {
      reportData = await generateYearlyReportData(userId, year);
    } else {
      // For wallet/budget/category types fall back to monthly data
      reportData = await generateMonthlyReportData(userId, month, year);
    }

    const fileName = `${type}-report-${Date.now()}`;

    // ── KEY CHANGE: PDF returns a Buffer, CSV returns a URL ──
    let fileUrl = null;
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

    return {
      reportId,
      fileUrl,
      pdfBuffer,   // Buffer for PDF — controller streams this directly
      type,
      format,
    };

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
  const currentDate = new Date();

  const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();

  const { start, end } = getMonthRange(targetMonth, targetYear);

  const allTransactions = await Transaction.find({
    userId,
    date: { $gte: start, $lte: end },
  })
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')
    .sort({ date: -1 });

  const recurringPayments = await RecurringPayment.find({
    userId,
    isActive: true,
  });

  const totals = allTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
      } else {
        acc.expense += tx.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, savings: 0 }
  );

  totals.savings = totals.income - totals.expense;

  const categoryBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        name: '$category.name',
        total: 1,
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Wallet Analytics
  const walletBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$wallet',
        total: { $sum: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'wallets',
        localField: '_id',
        foreignField: '_id',
        as: 'wallet',
      },
    },
    { $unwind: '$wallet' },
    {
      $project: {
        name: '$wallet.name',
        total: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Top Spending Day
  const dailySpending = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { day: { $dayOfMonth: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);

  // Financial Health Score
  let financialScore = 0;
  if (totals.income > 0) {
    const savingsRatio = (totals.savings / totals.income) * 100;
    if (savingsRatio >= 40) financialScore = 95;
    else if (savingsRatio >= 25) financialScore = 80;
    else if (savingsRatio >= 10) financialScore = 65;
    else financialScore = 40;
  }

  return {
    period: { month: targetMonth, year: targetYear },
    allTransactions,
    totals,
    categoryBreakdown,
    walletBreakdown,
    dailySpending,
    financialScore,
    recurringPayments,
    transactionCount: allTransactions.length,
  };
};

// =======================
// YEARLY DATA
// =======================

const generateYearlyReportData = async (userId, year) => {
  return generateMonthlyReportData(userId, null, year);
};

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

  // CSV is fine on Cloudinary as raw — plain text, no browser rendering issue
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'kharchaX/reports',
        public_id: fileName,
        format: 'csv',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(csv);
  });
};

// =======================
// PDF GENERATOR (PREMIUM)
// Returns a Buffer — NOT a Cloudinary URL
// Controller streams this buffer directly to browser
// =======================

const generatePDF = async (reportData, fileName) => {
  const {
    allTransactions,
    totals,
    period,
    categoryBreakdown,
    walletBreakdown,
    financialScore,
    recurringPayments,
  } = reportData;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // ── KEY CHANGE: resolve with Buffer, no Cloudinary upload ──
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });

    doc.on('error', reject);

    // =======================
    // PAGE 1 — COVER
    // =======================

    doc.rect(0, 0, 612, 792).fill(COLORS.dark);

    doc.fillColor(COLORS.white).fontSize(34).text('KharchaX', 50, 140, {
      align: 'center',
    });

    doc
      .fontSize(20)
      .fillColor('#818cf8')
      .text('AI Financial Analytics Report', 50, 200, { align: 'center' });

    doc
      .fontSize(14)
      .fillColor('#94a3b8')
      .text(
        `Report Period: ${
          period.month ? `${period.month}/${period.year}` : period.year
        }`,
        50,
        260,
        { align: 'center' }
      );

    doc
      .fontSize(12)
      .fillColor('#64748b')
      .text(
        `Generated on ${new Date().toLocaleDateString('en-IN')}`,
        50,
        300,
        { align: 'center' }
      );

    // =======================
    // PAGE 2 — SUMMARY & KPIs
    // =======================

    doc.addPage();

    let currentY = 50;

    currentY = drawSectionTitle(doc, 'Executive Summary', currentY);

    const savingsRate =
      totals.income > 0
        ? ((totals.savings / totals.income) * 100).toFixed(1)
        : 0;

    doc
      .fontSize(13)
      .fillColor(COLORS.dark)
      .text(`You saved ${savingsRate}% of your income this month.`, 50, currentY);

    currentY += 25;

    doc.text(
      `You completed ${allTransactions.length} financial transactions.`,
      50,
      currentY
    );

    currentY += 25;

    doc.text(
      `Your total recurring commitments are ${formatCurrency(
        (recurringPayments || []).reduce((sum, p) => sum + p.amount, 0)
      )}.`,
      50,
      currentY
    );

    // KPI Cards
    currentY += 60;

    drawMetricCard(
      doc, 50, currentY, 150, 85,
      'Income', formatCurrency(totals.income), COLORS.success
    );

    drawMetricCard(
      doc, 220, currentY, 150, 85,
      'Expenses', formatCurrency(totals.expense), COLORS.danger
    );

    drawMetricCard(
      doc, 390, currentY, 150, 85,
      'Savings', formatCurrency(totals.savings), COLORS.primary
    );

    // Financial Health Score
    currentY += 130;

    currentY = drawSectionTitle(doc, 'Financial Health Score', currentY);

    doc.roundedRect(50, currentY, 500, 30, 15).fill('#e5e7eb');

    const barWidth = Math.min((financialScore / 100) * 500, 500);
    if (barWidth > 0) {
      doc.roundedRect(50, currentY, barWidth, 30, 15).fill(COLORS.primary);
    }

    currentY += 40;

    doc
      .fillColor(COLORS.dark)
      .fontSize(18)
      .text(`${financialScore} / 100`, 50, currentY);

    const scoreLabel =
      financialScore >= 80
        ? 'Excellent'
        : financialScore >= 65
        ? 'Good'
        : financialScore >= 40
        ? 'Fair'
        : 'Needs Attention';

    doc.fontSize(13).fillColor(COLORS.gray).text(scoreLabel, 160, currentY + 3);

    // AI Insights
    currentY += 50;

    currentY = drawSectionTitle(doc, 'AI Financial Insights', currentY);

    const insights = [];

    if (totals.savings > 0)
      insights.push('Your savings are positive this month. Keep it up!');
    if (totals.expense > totals.income * 0.8)
      insights.push('Your expenses are close to your income. Consider cutting back.');
    if (categoryBreakdown[0])
      insights.push(
        `${categoryBreakdown[0].name} is your highest spending category.`
      );
    if ((recurringPayments || []).length > 5)
      insights.push('You have multiple active recurring subscriptions. Review them.');
    if (insights.length === 0)
      insights.push('Start adding transactions to see personalised insights.');

    insights.forEach((insight) => {
      doc.fontSize(12).fillColor(COLORS.dark).text(`• ${insight}`, 60, currentY);
      currentY += 24;
    });

    // =======================
    // PAGE 3 — CATEGORY ANALYTICS
    // =======================

    doc.addPage();

    currentY = 50;

    currentY = drawSectionTitle(doc, 'Category Analytics', currentY);

    const totalExpenses = categoryBreakdown.reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    if (categoryBreakdown.length === 0) {
      doc.fontSize(13).fillColor(COLORS.gray).text('No expense data for this period.', 60, currentY);
    } else {
      categoryBreakdown.forEach((category, index) => {
        const percentage =
          totalExpenses > 0
            ? ((category.total / totalExpenses) * 100).toFixed(1)
            : 0;

        if (index % 2 === 0) {
          doc.rect(45, currentY - 5, 500, 58).fill('#f8fafc');
        }

        doc.fillColor(COLORS.dark).fontSize(14).text(category.name, 60, currentY);

        doc
          .fillColor(COLORS.gray)
          .fontSize(12)
          .text(
            `${formatCurrency(category.total)}  (${percentage}%)`,
            390,
            currentY
          );

        doc.roundedRect(60, currentY + 22, 400, 10, 5).fill('#e5e7eb');
        const catBarWidth = Math.min(parseFloat(percentage) * 4, 400);
        if (catBarWidth > 0) {
          doc.roundedRect(60, currentY + 22, catBarWidth, 10, 5).fill(COLORS.primary);
        }

        currentY += 58;

        // New page if running out of space
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;
          currentY = drawSectionTitle(doc, 'Category Analytics (continued)', currentY);
        }
      });
    }

    // =======================
    // PAGE 4 — WALLET ANALYTICS
    // =======================

    doc.addPage();

    currentY = 50;

    currentY = drawSectionTitle(doc, 'Wallet Usage Analytics', currentY);

    if (!walletBreakdown || walletBreakdown.length === 0) {
      doc.fontSize(13).fillColor(COLORS.gray).text('No wallet data for this period.', 60, currentY);
      currentY += 30;
    } else {
      (walletBreakdown || []).forEach((wallet, index) => {
        if (index % 2 === 0) {
          doc.rect(45, currentY - 5, 500, 34).fill('#f8fafc');
        }

        doc.fillColor(COLORS.dark).fontSize(15).text(wallet.name, 60, currentY);

        doc
          .fillColor(COLORS.primary)
          .fontSize(15)
          .text(formatCurrency(wallet.total), 430, currentY);

        currentY += 40;
      });
    }

    // Recurring Payments
    currentY += 30;

    currentY = drawSectionTitle(doc, 'Recurring Payments', currentY);

    if (!recurringPayments || recurringPayments.length === 0) {
      doc.fontSize(13).fillColor(COLORS.gray).text('No active recurring payments.', 60, currentY);
    } else {
      (recurringPayments || []).forEach((payment) => {
        doc
          .fontSize(12)
          .fillColor(COLORS.dark)
          .text(
            `${payment.title} — ${formatCurrency(payment.amount)}`,
            60,
            currentY
          );
        currentY += 24;
      });
    }

    // =======================
    // PAGE 5 — TRANSACTIONS
    // =======================

    doc.addPage();

    currentY = 50;

    currentY = drawSectionTitle(doc, 'Recent Transactions', currentY);

    // Table header row
    doc.rect(45, currentY - 5, 510, 26).fill(COLORS.primary);

    doc
      .fillColor(COLORS.white)
      .fontSize(11)
      .text('Date', 55, currentY)
      .text('Category', 170, currentY)
      .text('Wallet', 300, currentY)
      .text('Type', 390, currentY)
      .text('Amount', 460, currentY);

    currentY += 30;

    if (allTransactions.length === 0) {
      doc.fontSize(13).fillColor(COLORS.gray).text('No transactions for this period.', 60, currentY);
    } else {
      allTransactions.slice(0, 25).forEach((tx, index) => {
        if (index % 2 === 0) {
          doc.rect(45, currentY - 5, 510, 24).fill('#f8fafc');
        }

        doc.fillColor(COLORS.dark).fontSize(10);

        doc.text(new Date(tx.date).toLocaleDateString('en-IN'), 55, currentY);
        doc.text((tx.category?.name || 'Unknown').substring(0, 14), 170, currentY);
        doc.text((tx.wallet?.name || 'Wallet').substring(0, 12), 300, currentY);

        doc.fillColor(tx.type === 'income' ? COLORS.success : COLORS.danger);
        doc.text(tx.type.toUpperCase(), 390, currentY);

        doc.fillColor(COLORS.dark);
        doc.text(formatCurrency(tx.amount), 460, currentY);

        currentY += 26;
      });
    }

    // =======================
    // PAGE 6 — CLOSING
    // =======================

    doc.addPage();

    doc.rect(0, 0, 612, 792).fill(COLORS.dark);

    doc.fillColor(COLORS.white).fontSize(28).text('AI Insights', 50, 100);

    const finalInsight =
      totals.savings > 0
        ? 'Excellent savings performance this month. You are on track!'
        : totals.income === 0
        ? 'No income recorded this period. Add your income transactions to see insights.'
        : 'Your expenses exceeded income this month. Reduce non-essential spending.';

    doc.fontSize(16).fillColor('#cbd5e1').text(finalInsight, 50, 160, { width: 500 });

    doc
      .fontSize(14)
      .fillColor('#818cf8')
      .text(
        '\nKharchaX transforms your financial data into actionable intelligence.',
        50,
        240,
        { width: 500 }
      );

    doc
      .fontSize(12)
      .fillColor('#64748b')
      .text(
        'Financial Health Score reflects your savings discipline, recurring commitments, and spending balance.',
        50,
        320,
        { width: 500 }
      );

    doc
      .fontSize(10)
      .fillColor('#334155')
      .text(
        'Generated by KharchaX — AI Financial Intelligence Platform',
        50,
        750,
        { align: 'center', width: 512 }
      );

    doc.end();
  });
};

export { generateReport };