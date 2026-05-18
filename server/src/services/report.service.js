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

const generatePDF = async (reportData, fileName, userId) => {
  const { allTransactions, totals, period, categoryBreakdown } = reportData;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'kharchaX/reports',
              public_id: `${fileName}-${Date.now()}`,
              format: 'pdf'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          uploadStream.end(buffer);
        });

        resolve(result.secure_url);
      } catch (error) {
        reject(error);
      }
    });

    // Page 1 — Cover
    doc.fontSize(28).fillColor('#6366f1').text('KharchaX', 50, 100, { align: 'center' });
    doc.fontSize(18).fillColor('#ffffff').text('Monthly Financial Report', 50, 140, { align: 'center' });
    
    const periodText = period.month 
      ? new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      : `${period.year}`;
    doc.fontSize(14).fillColor('#a1a1aa').text(periodText, 50, 170, { align: 'center' });
    
    // Add user info (you might want to fetch user details)
    doc.fontSize(12).fillColor('#a1a1aa').text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 50, 200, { align: 'center' });

    // Page 2 — Summary
    doc.addPage();
    doc.fontSize(20).fillColor('#ffffff').text('Financial Summary', 50, 50);
    
    // Summary boxes
    const boxY = 100;
    const boxWidth = 150;
    const boxHeight = 80;
    const boxSpacing = 20;
    
    // Income box
    doc.rect(50, boxY, boxWidth, boxHeight).fill('#22c55e');
    doc.fillColor('#ffffff').fontSize(12).text('Total Income', 60, boxY + 20);
    doc.fontSize(20).text(`₹${totals.income.toLocaleString('en-IN')}`, 60, boxY + 50);
    
    // Expense box
    doc.rect(50 + boxWidth + boxSpacing, boxY, boxWidth, boxHeight).fill('#ef4444');
    doc.fillColor('#ffffff').fontSize(12).text('Total Expenses', 60 + boxWidth + boxSpacing, boxY + 20);
    doc.fontSize(20).text(`₹${totals.expense.toLocaleString('en-IN')}`, 60 + boxWidth + boxSpacing, boxY + 50);
    
    // Savings box
    doc.rect(50 + (boxWidth + boxSpacing) * 2, boxY, boxWidth, boxHeight).fill('#6366f1');
    doc.fillColor('#ffffff').fontSize(12).text('Net Savings', 60 + (boxWidth + boxSpacing) * 2, boxY + 20);
    doc.fontSize(20).text(`₹${totals.savings.toLocaleString('en-IN')}`, 60 + (boxWidth + boxSpacing) * 2, boxY + 50);

    // Page 3 — Category Breakdown
    if (categoryBreakdown && categoryBreakdown.length > 0) {
      doc.addPage();
      doc.fontSize(20).fillColor('#ffffff').text('Category Breakdown', 50, 50);
      
      let y = 100;
      doc.fontSize(12).fillColor('#a1a1aa').text('Category', 50, y);
      doc.text('Amount', 250, y);
      doc.text('% of Total', 400, y);
      
      y += 20;
      const grandTotal = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);
      
      categoryBreakdown.forEach((category, index) => {
        const percentage = grandTotal > 0 ? ((category.total / grandTotal) * 100).toFixed(1) : 0;
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.rect(50, y - 5, 450, 20).fill('#1a1a1a');
        }
        
        doc.fillColor('#ffffff').text(category.name, 60, y + 10);
        doc.text(`₹${category.total.toLocaleString('en-IN')}`, 260, y + 10);
        doc.text(`${percentage}%`, 410, y + 10);
        
        y += 25;
      });
    }

    // Page 4 — Transactions
    doc.addPage();
    doc.fontSize(20).fillColor('#ffffff').text('Transactions', 50, 50);
    
    let y = 100;
    doc.fontSize(12).fillColor('#a1a1aa').text('Date', 50, y);
    doc.text('Type', 150, y);
    doc.text('Category', 250, y);
    doc.text('Amount', 400, y);
    
    y += 20;
    let pageCount = 0;
    
    allTransactions.forEach((transaction, index) => {
      if (index > 0 && index % 30 === 0) {
        doc.addPage();
        pageCount++;
        y = 100;
        doc.fontSize(20).fillColor('#ffffff').text('Transactions (continued)', 50, 50);
        doc.fontSize(12).fillColor('#a1a1aa').text('Date', 50, y);
        doc.text('Type', 150, y);
        doc.text('Category', 250, y);
        doc.text('Amount', 400, y);
        y += 20;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, y - 5, 450, 20).fill('#1a1a1a');
      }
      
      const date = new Date(transaction.date).toLocaleDateString('en-IN');
      const category = transaction.category?.name || 'Unknown';
      
      doc.fillColor('#ffffff').text(date, 60, y + 10);
      doc.text(transaction.type, 160, y + 10);
      doc.text(category, 260, y + 10);
      doc.text(`₹${transaction.amount.toLocaleString('en-IN')}`, 410, y + 10);
      
      y += 25;
    });

    doc.end();
  });
};

export { generateReport };
