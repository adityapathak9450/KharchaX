import Report from '../models/Report.model.js';
import { generateReport } from '../services/report.service.js';
import User from '../models/User.model.js';

export const getReports = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

export const generateReportController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, month, year, format } = req.body;

    // Validate report type
    const validTypes = [
      'monthly',
      'yearly',
      'wallet',
      'category',
      'budget',
    ];

    // Validate format
    const validFormats = ['pdf', 'csv'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type',
      });
    }

    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format',
      });
    }

    // Validate month
    if (
      month !== undefined &&
      (isNaN(month) || month < 1 || month > 12)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month',
      });
    }

    // Validate year
    if (
      year !== undefined &&
      (isNaN(year) || year < 2000 || year > 2100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year',
      });
    }

    // Create report record
    const report = new Report({
      userId,
      type,
      period: {
        month,
        year,
      },
      format,
      status: 'pending',
    });

    await report.save();

    // Async generation
    generateReport(report._id, userId, {
      type,
      month,
      year,
      format,
    })
      .then((result) => {
        const io = req.app.get('io');

        if (io) {
          io.to(userId.toString()).emit('report:ready', result);
        }
      })
      .catch((error) => {
        console.error('Report generation failed:', error);

        const io = req.app.get('io');

        if (io) {
          io.to(userId.toString()).emit('report:failed', {
            reportId: report._id,
            error: error.message,
          });
        }
      });

    res.status(201).json({
      success: true,
      message: 'Report generation started',
      data: {
        reportId: report._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findOne({
      _id: id,
      userId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (report.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Report not ready yet',
      });
    }

    // CSV download
    if (report.format === 'csv' && report.fileUrl) {
      return res.redirect(report.fileUrl);
    }

    // Get user name
    const user = await User.findById(userId).select('name');

    const userName = (user?.name || 'user')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();

    // Safe month name
    const month =
      report.period?.month >= 1 &&
      report.period?.month <= 12
        ? report.period.month
        : null;

    const monthName = month
      ? new Date(2000, month - 1).toLocaleString('en-IN', {
          month: 'long',
        })
      : '';

    // Generate filename
    const fileName = [
      monthName,
      report.period?.year,
      report.type,
      'report',
      userName,
    ]
      .filter(Boolean)
      .join('_');

    // Generate PDF buffer
    const result = await generateReport(report._id, userId, {
      type: report.type,
      month: report.period?.month,
      year: report.period?.year,
      format: 'pdf',
       skipStatusUpdate: true, 
    });

    if (!result?.pdfBuffer) {
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
      });
    }

    // Response headers
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}.pdf"`
    );

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Length',
      result.pdfBuffer.length
    );
    // Add this before res.send()
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(result.pdfBuffer);d
  } catch (error) {
    next(error);
  }
};

export const getReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findOne({
      _id: id,
      userId,
    }).select('status fileUrl generatedAt error');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findOneAndDelete({ _id: id, userId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.json({
      success: true,
      message: 'Report deleted',
    });

  } catch (error) {
    next(error);
  }
};
