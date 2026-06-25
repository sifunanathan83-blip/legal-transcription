import express from 'express';
import logger from '../config/logger.js';
import TranscriptSegmentManager from '../services/transcription/segment-manager.js';
import CaseManager from '../services/case/case-manager.js';
import SpeakerManager from '../services/speaker/speaker-manager.js';
import legalFormatter from '../services/formatting/legal-formatter.js';
import { NotFoundError, ValidationError } from '../middleware/error-handler.js';

const router = express.Router();

// Get transcription session
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const segments = await TranscriptSegmentManager.getSessionSegments(
      sessionId,
      limit,
      offset
    );

    if (segments.length === 0) {
      throw new NotFoundError(`Session ${sessionId} not found`);
    }

    const wordCount = await TranscriptSegmentManager.getWordCount(sessionId);

    res.json({
      success: true,
      sessionId,
      segmentCount: segments.length,
      wordCount,
      limit,
      offset,
      segments,
    });
  } catch (error) {
    next(error);
  }
});

// Get segment by ID
router.get('/:sessionId/segment/:segmentId', async (req, res, next) => {
  try {
    const segment = await TranscriptSegmentManager.getSegment(
      req.params.segmentId
    );

    if (!segment) {
      throw new NotFoundError(
        `Segment ${req.params.segmentId} not found`
      );
    }

    res.json({
      success: true,
      segment,
    });
  } catch (error) {
    next(error);
  }
});

// Get speaker segments
router.get('/:sessionId/speaker/:speakerId', async (req, res, next) => {
  try {
    const segments = await TranscriptSegmentManager.getSpeakerSegments(
      req.params.sessionId,
      req.params.speakerId
    );

    res.json({
      success: true,
      sessionId: req.params.sessionId,
      speakerId: req.params.speakerId,
      segmentCount: segments.length,
      segments,
    });
  } catch (error) {
    next(error);
  }
});

// Get objections
router.get('/:sessionId/objections', async (req, res, next) => {
  try {
    const objections = await TranscriptSegmentManager.getObjections(
      req.params.sessionId
    );

    res.json({
      success: true,
      sessionId: req.params.sessionId,
      objectionCount: objections.length,
      objections,
    });
  } catch (error) {
    next(error);
  }
});

// Correct segment
router.post('/:sessionId/segment/:segmentId/correct', async (req, res, next) => {
  try {
    const { corrected_text, reason } = req.body;

    if (!corrected_text) {
      throw new ValidationError('corrected_text is required');
    }

    const segment = await TranscriptSegmentManager.getSegment(
      req.params.segmentId
    );

    if (!segment) {
      throw new NotFoundError(
        `Segment ${req.params.segmentId} not found`
      );
    }

    const revisionId = await TranscriptSegmentManager.createRevision(
      req.params.segmentId,
      segment.text,
      corrected_text,
      reason
    );

    res.json({
      success: true,
      revisionId,
      message: 'Segment corrected',
    });
  } catch (error) {
    next(error);
  }
});

// Get formatted transcript
router.get('/:sessionId/formatted', async (req, res, next) => {
  try {
    const segments = await TranscriptSegmentManager.getSessionSegments(
      req.params.sessionId,
      10000,
      0
    );

    if (segments.length === 0) {
      throw new NotFoundError(`Session ${req.params.sessionId} not found`);
    }

    // Get metadata
    const caseData = await CaseManager.getCase(segments[0].session_id); // Would need to fix this

    const formatted = legalFormatter.formatCompleteTranscript(
      segments,
      caseData
    );

    res.json({
      success: true,
      sessionId: req.params.sessionId,
      formatted,
      segmentCount: segments.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;