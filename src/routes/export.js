import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';
import TranscriptSegmentManager from '../services/transcription/segment-manager.js';
import CaseManager from '../services/case/case-manager.js';
import legalFormatter from '../services/formatting/legal-formatter.js';
import { NotFoundError, ValidationError } from '../middleware/error-handler.js';

const router = express.Router();

// Export transcript
router.post('/:sessionId', async (req, res, next) => {
  try {
    const { format = 'txt', options = {} } = req.body;

    const validFormats = ['txt', 'json'];
    if (!validFormats.includes(format)) {
      throw new ValidationError(
        `Format must be one of: ${validFormats.join(', ')}`
      );
    }

    // Get all segments
    const segments = await TranscriptSegmentManager.getSessionSegments(
      req.params.sessionId,
      10000,
      0
    );

    if (segments.length === 0) {
      throw new NotFoundError(`Session ${req.params.sessionId} not found`);
    }

    let exportData;

    if (format === 'txt') {
      exportData = legalFormatter.formatCompleteTranscript(segments, options);
    } else if (format === 'json') {
      exportData = JSON.stringify(
        {
          sessionId: req.params.sessionId,
          exportedAt: new Date().toISOString(),
          segmentCount: segments.length,
          segments,
        },
        null,
        2
      );
    }

    logger.info(`Exported session ${req.params.sessionId} as ${format}`);

    res.json({
      success: true,
      sessionId: req.params.sessionId,
      format,
      exportedAt: new Date().toISOString(),
      size: exportData.length,
      preview: exportData.substring(0, 500),
    });
  } catch (error) {
    next(error);
  }
});

// Get export history
router.get('/:sessionId/history', async (req, res, next) => {
  try {
    const db = require('../config/database.js').getDatabase();

    const exports = await db.all(
      'SELECT id, format, file_size, exported_by, created_at FROM exports WHERE session_id = ? ORDER BY created_at DESC',
      [req.params.sessionId]
    );

    res.json({
      success: true,
      sessionId: req.params.sessionId,
      exportCount: exports.length,
      exports,
    });
  } catch (error) {
    next(error);
  }
});

export default router;