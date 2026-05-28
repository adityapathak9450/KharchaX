import Transaction from '../models/Transaction.model.js';
import Category from '../models/Category.model.js';
import Report from '../models/Report.model.js';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';

// Helper function to get month range
const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateReport = async (reportId, userId, options) => {
  try {
    const { type, month, year, format } = options;

    // Update report status to 'generating'
    await Report.findByIdAndUpdate(reportId, { status: 'generating' });

    // Fetch data based on report type
    let reportData;
    if (type === 'monthly') {
      reportData = await generateMonthlyReportData(userId, month, year);
    } else if (type === 'yearly') {
      reportData = await generateYearlyReportData(userId, year);
    } else {
      throw new Error('Invalid report type');
    }

    let fileUrl;
    let fileName = `${type}-report-${month || year}-${year || new Date().getFullYear()}`;

    if (format === 'csv') {
      fileUrl = await generateCSV(reportData, fileName);
    } else if (format === 'pdf') {
      fileUrl = await generatePDF(reportData, fileName, userId);
    } else {
      throw new Error('Invalid format');
    }

    // Update Report record
    await Report.findByIdAndUpdate(reportId, {
      status: 'ready',
      fileUrl,
      generatedAt: new Date(),
    });

    // Emit socket event (will be handled by controller)
    return { reportId, fileUrl, type, format };

  } catch (error) {
    // Update report status to 'failed'
    await Report.findByIdAndUpdate(reportId, { 
      status: 'failed',
      error: error.message 
    });
    throw error;
  }
};

const generateMonthlyReportData = async (userId, month, year) => {
  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();

  const { start, end } = getMonthRange(targetMonth, targetYear);

  // Get all transactions for the period
  const allTransactions = await Transaction.find({
    userId,
    date: { $gte: start, $lte: end }
  })
  .populate('category', 'name color icon')
  .populate('wallet', 'name type')
  .sort({ date: -1 });

  // Calculate totals
  const totals = allTransactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += transaction.amount;
    } else {
      acc.expense += transaction.amount;
    }
    return acc;
  }, { income: 0, expense: 0, savings: 0 });

  totals.savings = totals.income - totals.expense;

  // Category breakdown
  const categoryBreakdown = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $project: {
        name: '$category.name',
        color: '$category.color',
        total: 1,
        count: 1
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);

  return {
    period: { month: targetMonth, year: targetYear },
    allTransactions,
    totals,
    categoryBreakdown,
    transactionCount: allTransactions.length,
  };
};

const generateYearlyReportData = async (userId, year) => {
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const start = new Date(targetYear, 0, 1);
  const end = new Date(targetYear, 11, 31, 23, 59, 59);

  // Get all transactions for the year
  const allTransactions = await Transaction.find({
    userId,
    date: { $gte: start, $lte: end }
  })
  .populate('category', 'name color icon')
  .populate('wallet', 'name type')
  .sort({ date: -1 });

  // Calculate totals
  const totals = allTransactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += transaction.amount;
    } else {
      acc.expense += transaction.amount;
    }
    return acc;
  }, { income: 0, expense: 0, savings: 0 });

  totals.savings = totals.income - totals.expense;

  // Monthly breakdown
  const monthlyData = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type"
        },
        total: { $sum: "$amount" }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);

  return {
    period: { year: targetYear },
    allTransactions,
    totals,
    monthlyData,
    transactionCount: allTransactions.length,
  };
};

const generateCSV = async (reportData, fileName) => {
  const { allTransactions, period } = reportData;
  
  // Build CSV string
  let csvContent = `KharchaX Financial Report - ${period.month ? new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' }) : period.year} ${period.year}\n\n`;
  csvContent += 'Date,Type,Category,Wallet,Amount,Notes\n';

  allTransactions.forEach(transaction => {
    const date = new Date(transaction.date).toLocaleDateString('en-IN');
    const notes = transaction.notes ? `"${transaction.notes.replace(/"/g, '""')}"` : '';
    const category = transaction.category?.name || 'Unknown';
    const wallet = transaction.wallet?.name || 'Unknown';
    
    csvContent += `${date},${transaction.type},${category},${wallet},${transaction.amount},${notes}\n`;
  });

  // Upload to Cloudinary as text file
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'kharchaX/reports',
        public_id: `${fileName}-${Date.now()}`,
        format: 'csv'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    uploadStream.end(csvContent);
  });
};

const generatePDF = async (reportData, fileName) => {
  const { allTransactions, totals, period } = reportData;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);

       const base64PDF = pdfBuffer.toString('base64');

const dataURI = `data:application/pdf;base64,${base64PDF}`;

const result = await cloudinary.uploader.upload(dataURI, {
  resource_type: 'raw',
  folder: 'kharchaX/reports',
  public_id: `${fileName}-${Date.now()}`
});

        resolve(result.secure_url);
      } catch (error) {
        reject(error);
      }
    });

    // ===== SIMPLE PDF CONTENT =====

    doc.fontSize(24).text('KharchaX Financial Report', {
      align: 'center',
    });

    doc.moveDown();

    doc.fontSize(16).text(
      `Period: ${
        period.month
          ? `${period.month}/${period.year}`
          : period.year
      }`
    );

    doc.moveDown();

    doc.fontSize(14).text(`Total Income: ₹${totals.income}`);
    doc.text(`Total Expense: ₹${totals.expense}`);
    doc.text(`Net Savings: ₹${totals.savings}`);

    doc.moveDown();

    doc.fontSize(18).text('Transactions');

    doc.moveDown();

    allTransactions.slice(0, 20).forEach((tx, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${tx.type.toUpperCase()} | ₹${tx.amount} | ${
          tx.category?.name || 'Unknown'
        }`
      );
    });

    doc.end();
  });
};

export { generateReport };
