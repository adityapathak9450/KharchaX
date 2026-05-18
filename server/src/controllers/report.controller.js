import Report from '../models/Report.model.js';
import { generateReport } from '../services/report.service.js';

export const getReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    next(error);
  }
};

export const generateReportController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, month, year, format } = req.body;

    // Validate input
    const validTypes = ['monthly', 'yearly', 'wallet', 'category'];
    const validFormats = ['pdf', 'csv'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }

    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format'
      });
    }

    // Create Report record
    const report = new Report({
      userId,
      type,
      period: { month, year },
      format,
      status: 'pending'
    });

    await report.save();

    // Start async generation (DON'T await)
    generateReport(report._id, userId, { type, month, year, format })
      .then((result) => {
        // Emit socket event (will be handled by socket middleware)
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
            error: error.message 
          });
        }
      });

    res.status(201).json({
      success: true,
      message: 'Report generation started',
      data: { reportId: report._id }
    });

  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find report by id, verify ownership
    const report = await Report.findOne({ _id: id, userId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Report not ready yet'
      });
    }

    if (!report.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'Report file not available'
      });
    }

    // Redirect to Cloudinary URL for direct download
    res.redirect(report.fileUrl);

  } catch (error) {
    next(error);
  }
};

export const getReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findOne({ _id: id, userId })
      .select('status fileUrl generatedAt error');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    next(error);
  }
};
