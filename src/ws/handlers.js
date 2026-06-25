import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { WS_MESSAGE_TYPES, SESSION_STATUS } from '../utils/constants.js';
import TranscriptionEngine from '../services/transcription/transcriber.js';
import AudioProcessor from '../services/transcription/audio-processor.js';
import CaseManager from '../services/case/case-manager.js';
import SpeakerManager from '../services/speaker/speaker-manager.js';
import TranscriptSegmentManager from '../services/transcription/segment-manager.js';
import legalFormatter from '../services/formatting/legal-formatter.js';
import objectionDetector from '../services/formatting/objection-detector.js';

const activeSessions = new Map();

class ConnectionManager {
  handleConnection(ws, req) {
    const clientId = uuidv4();
    let sessionState = null;

    logger.info(`Client connected: ${clientId}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        await this.handleMessage(ws, message, sessionState, clientId);
      } catch (error) {
        logger.error('WebSocket message error:', error);
        ws.send(
          JSON.stringify({
            type: WS_MESSAGE_TYPES.ERROR,
            error: error.message,
          })
        );
      }
    });

    ws.on('close', () => {
      if (sessionState) {
        activeSessions.delete(sessionState.sessionId);
      }
      logger.info(`Client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
    });
  }

  async handleMessage(ws, message, sessionState, clientId) {
    switch (message.type) {
      case WS_MESSAGE_TYPES.INIT:
        await this.initSession(ws, message, sessionState, clientId);
        break;

      case WS_MESSAGE_TYPES.AUDIO_CHUNK:
        await this.processAudioChunk(ws, message, sessionState);
        break;

      case WS_MESSAGE_TYPES.PAUSE:
        await this.pauseSession(ws, sessionState);
        break;

      case WS_MESSAGE_TYPES.RESUME:
        await this.resumeSession(ws, sessionState);
        break;

      case WS_MESSAGE_TYPES.CORRECTION:
        await this.correctSegment(ws, message, sessionState);
        break;

      case WS_MESSAGE_TYPES.OBJECTION_MARKER:
        await this.markObjection(ws, message, sessionState);
        break;

      case WS_MESSAGE_TYPES.END_SESSION:
        await this.endSession(ws, sessionState);
        break;

      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  async initSession(ws, message, sessionState, clientId) {
    try {
      const { case_id, speakers, title } = message;

      if (!case_id || !speakers || speakers.length === 0) {
        throw new Error('Invalid session initialization data');
      }

      // Create transcription session
      const sessionId = await CaseManager.createSession(case_id, { title });

      // Register speakers
      const speakerMap = new Map();
      for (const speaker of speakers) {
        const speakerId = await SpeakerManager.registerSpeaker(sessionId, speaker);
        speakerMap.set(speaker.id, { ...speaker, dbId: speakerId });
        legalFormatter.registerSpeaker(speakerId, speaker.label);
      }

      // Initialize transcription engine
      const transcriber = new TranscriptionEngine(
        process.env.TRANSCRIPTION_SERVICE || 'mock'
      );
      const audioProcessor = new AudioProcessor();

      // Store session state
      sessionState = {
        sessionId,
        caseId: case_id,
        speakers: speakerMap,
        transcriber,
        audioProcessor,
        status: SESSION_STATUS.ACTIVE,
        startTime: Date.now(),
        segmentCount: 0,
      };

      activeSessions.set(sessionId, sessionState);

      logger.info(`Session initialized: ${sessionId}`);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.SESSION_STARTED,
          sessionId,
          speakers: Array.from(speakerMap.values()),
        })
      );
    } catch (error) {
      logger.error('Session initialization error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }

  async processAudioChunk(ws, message, sessionState) {
    if (!sessionState || sessionState.status !== SESSION_STATUS.ACTIVE) {
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: 'Session not active',
        })
      );
      return;
    }

    try {
      const { audio, speaker_id, timestamp } = message;

      // Process audio
      const audioBuffer = Buffer.from(audio, 'base64');
      const processed = sessionState.audioProcessor.processChunk(audioBuffer);

      // Transcribe
      const transcription = await sessionState.transcriber.transcribe(
        audioBuffer
      );

      if (!transcription || !transcription.text) {
        return; // Skip empty transcriptions
      }

      // Get speaker info
      const speaker = sessionState.speakers.get(speaker_id);
      if (!speaker) {
        throw new Error(`Speaker ${speaker_id} not found`);
      }

      // Detect objections and procedural markers
      const objectionInfo = objectionDetector.detectObjection(
        transcription.text
      );
      const rulingInfo = objectionDetector.detectRuling(transcription.text);

      // Create segment
      const startTime = timestamp || Date.now() - sessionState.startTime;
      const endTime = startTime + (processed?.length || 0);

      const segmentData = {
        speaker_id: speaker.dbId,
        text: transcription.text,
        start_time_ms: startTime,
        end_time_ms: endTime,
        confidence: transcription.confidence,
        is_objection: objectionInfo.found,
        is_procedural: LEGAL_FORMATTING.PROCEDURAL_MARKERS.some((marker) =>
          transcription.text.toLowerCase().includes(marker.toLowerCase())
        ),
        tags: objectionDetector.generateTags(
          transcription.text,
          objectionInfo,
          rulingInfo
        ),
      };

      const segmentId = await TranscriptSegmentManager.createSegment(
        sessionState.sessionId,
        segmentData
      );

      sessionState.segmentCount++;

      // Format for output
      const formatted = legalFormatter.formatSegment(segmentData);

      // Send to client
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.TRANSCRIPT_SEGMENT,
          segmentId,
          speaker: speaker.label,
          text: transcription.text,
          formatted,
          confidence: transcription.confidence,
          isObjection: objectionInfo.found,
          objectionType: objectionInfo.type,
          timestamp: new Date().toISOString(),
        })
      );

      // Alert if low confidence
      if (transcription.confidence < 0.75) {
        ws.send(
          JSON.stringify({
            type: WS_MESSAGE_TYPES.CONFIDENCE_ALERT,
            confidence: transcription.confidence,
            segmentId,
            message: 'Low confidence transcription - please review',
          })
        );
      }
    } catch (error) {
      logger.error('Audio processing error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }

  async pauseSession(ws, sessionState) {
    if (!sessionState) {
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: 'No active session',
        })
      );
      return;
    }

    try {
      sessionState.status = SESSION_STATUS.PAUSED;
      logger.info(`Session paused: ${sessionState.sessionId}`);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.STATUS_UPDATE,
          status: SESSION_STATUS.PAUSED,
        })
      );
    } catch (error) {
      logger.error('Pause session error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }

  async resumeSession(ws, sessionState) {
    if (!sessionState) {
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: 'No active session',
        })
      );
      return;
    }

    try {
      sessionState.status = SESSION_STATUS.ACTIVE;
      logger.info(`Session resumed: ${sessionState.sessionId}`);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.STATUS_UPDATE,
          status: SESSION_STATUS.ACTIVE,
        })
      );
    } catch (error) {
      logger.error('Resume session error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }

  async correctSegment(ws, message, sessionState) {
    try {
      const { segment_id, corrected_text, reason } = message;

      const segment = await TranscriptSegmentManager.getSegment(segment_id);
      if (!segment) {
        throw new Error('Segment not found');
      }

      await TranscriptSegmentManager.createRevision(
        segment_id,
        segment.text,
        corrected_text,
        reason
      );

      logger.info(`Segment corrected: ${segment_id}`);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.TRANSCRIPT_SEGMENT,
          segmentId: segment_id,
          text: corrected_text,
          isCorrection: true,
        })
      );
    } catch (error) {
      logger.error('Correction error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }

  async markObjection(ws, message, sessionState) {
    try {
      const { segment_id, objection_type } = message;

      await TranscriptSegmentManager.updateSegment(segment_id, {
        is_objection: 1,
      });

      logger.info(`Objection marked: ${segment_id}`);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.STATUS_UPDATE,
          message: 'Objection marked',
        })
      );
    } catch (error) {
      logger.error('Mark objection error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }

  async endSession(ws, sessionState) {
    if (!sessionState) {
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: 'No active session',
        })
      );
      return;
    }

    try {
      const duration = Date.now() - sessionState.startTime;
      const wordCount = await TranscriptSegmentManager.getWordCount(
        sessionState.sessionId
      );

      // Update session
      await CaseManager.updateSession(sessionState.sessionId, {
        status: SESSION_STATUS.COMPLETED,
        ended_at: new Date().toISOString(),
        duration_seconds: Math.floor(duration / 1000),
        word_count: wordCount,
        speaker_count: sessionState.speakers.size,
      });

      activeSessions.delete(sessionState.sessionId);

      logger.info(`Session ended: ${sessionState.sessionId}`);

      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.SESSION_ENDED,
          sessionId: sessionState.sessionId,
          duration: duration,
          wordCount,
          segmentCount: sessionState.segmentCount,
        })
      );
    } catch (error) {
      logger.error('End session error:', error);
      ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPES.ERROR,
          error: error.message,
        })
      );
    }
  }
}

const connectionManager = new ConnectionManager();
export default connectionManager;