import logger from '../../config/logger.js';
import { AUDIO_CONFIG } from '../../utils/constants.js';

export class AudioProcessor {
  constructor() {
    this.sampleRate = AUDIO_CONFIG.SAMPLE_RATE;
    this.channels = AUDIO_CONFIG.CHANNELS;
    this.bitDepth = AUDIO_CONFIG.BIT_DEPTH;
    this.chunkBuffer = [];
    this.totalProcessed = 0;
  }

  /**
   * Process audio chunk
   */
  processChunk(buffer) {
    if (!buffer || buffer.length === 0) {
      return null;
    }

    this.totalProcessed += buffer.length;

    // Convert buffer to PCM data if needed
    const pcmData = this.bufferToPCM(buffer);

    return {
      data: pcmData,
      length: pcmData.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Convert buffer to PCM format
   */
  bufferToPCM(buffer) {
    if (buffer instanceof Float32Array) {
      return buffer;
    }

    if (Buffer.isBuffer(buffer)) {
      const pcm = new Float32Array(buffer.length / 2);
      for (let i = 0; i < pcm.length; i++) {
        pcm[i] = buffer.readInt16LE(i * 2) / 32768;
      }
      return pcm;
    }

    if (Array.isArray(buffer)) {
      return new Float32Array(buffer);
    }

    return new Float32Array(0);
  }

  /**
   * Calculate audio duration in milliseconds
   */
  calculateDuration(byteLength) {
    const samples = byteLength / (this.bitDepth / 8) / this.channels;
    return (samples / this.sampleRate) * 1000;
  }

  /**
   * Get total processed duration
   */
  getTotalDuration() {
    return this.calculateDuration(this.totalProcessed);
  }

  /**
   * Validate audio format
   */
  validateFormat(buffer) {
    if (!buffer || buffer.length === 0) {
      return {
        valid: false,
        error: 'Empty buffer',
      };
    }

    if (buffer.length < 100) {
      return {
        valid: false,
        error: 'Buffer too small',
      };
    }

    return {
      valid: true,
      error: null,
    };
  }

  /**
   * Reset processor
   */
  reset() {
    this.chunkBuffer = [];
    this.totalProcessed = 0;
  }
}

export default AudioProcessor;