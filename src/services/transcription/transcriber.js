import axios from 'axios';
import logger from '../../config/logger.js';
import { TRANSCRIPTION_SERVICES } from '../../utils/constants.js';

export class TranscriptionEngine {
  constructor(service = TRANSCRIPTION_SERVICES.MOCK) {
    this.service = service;
    this.apiKey = process.env[`${service.toUpperCase()}_API_KEY`];
    this.isConfigured = !!this.apiKey || service === TRANSCRIPTION_SERVICES.MOCK;
  }

  /**
   * Transcribe audio stream
   */
  async transcribe(audioBuffer, options = {}) {
    if (this.service === TRANSCRIPTION_SERVICES.GOOGLE) {
      return this.transcribeGoogle(audioBuffer, options);
    } else if (this.service === TRANSCRIPTION_SERVICES.AZURE) {
      return this.transcribeAzure(audioBuffer, options);
    } else {
      return this.transcribeMock(audioBuffer, options);
    }
  }

  /**
   * Transcribe using Google Cloud Speech-to-Text
   */
  async transcribeGoogle(audioBuffer, options) {
    if (!this.isConfigured) {
      logger.warn('Google API key not configured, using mock transcription');
      return this.transcribeMock(audioBuffer, options);
    }

    try {
      const response = await axios.post(
        'https://speech.googleapis.com/v1/speech:recognize',
        {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: options.languageCode || 'en-US',
            maxAlternatives: 1,
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioBuffer.toString('base64'),
          },
        },
        {
          params: { key: this.apiKey },
        }
      );

      return this.formatGoogleResponse(response.data);
    } catch (error) {
      logger.error('Google transcription error:', error.message);
      throw error;
    }
  }

  /**
   * Format Google response
   */
  formatGoogleResponse(data) {
    if (!data.results || data.results.length === 0) {
      return {
        text: '',
        confidence: 0,
        alternatives: [],
      };
    }

    const result = data.results[0];
    const transcript = result.alternatives[0];

    return {
      text: transcript.transcript,
      confidence: transcript.confidence || 0.9,
      alternatives: result.alternatives.slice(1).map((alt) => ({
        text: alt.transcript,
        confidence: alt.confidence || 0.7,
      })),
    };
  }

  /**
   * Transcribe using Azure Cognitive Services
   */
  async transcribeAzure(audioBuffer, options) {
    if (!this.isConfigured) {
      logger.warn('Azure key not configured, using mock transcription');
      return this.transcribeMock(audioBuffer, options);
    }

    try {
      const region = process.env.AZURE_SPEECH_REGION || 'eastus';
      const response = await axios.post(
        `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
        audioBuffer,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'audio/wav',
          },
          params: {
            language: options.languageCode || 'en-US',
          },
        }
      );

      return this.formatAzureResponse(response.data);
    } catch (error) {
      logger.error('Azure transcription error:', error.message);
      throw error;
    }
  }

  /**
   * Format Azure response
   */
  formatAzureResponse(data) {
    return {
      text: data.DisplayText || '',
      confidence: 0.85,
      alternatives: [],
    };
  }

  /**
   * Mock transcription for testing
   */
  async transcribeMock(audioBuffer, options) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const mockTexts = [
      'The witness will now testify regarding the events of that day.',
      'Objection, assumes facts not in evidence.',
      'THE COURT: Overruled. The witness may answer.',
      'Please state your name for the record.',
      'Whereupon, a brief recess was taken.',
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    return {
      text: randomText,
      confidence: 0.92,
      alternatives: [],
    };
  }

  /**
   * Check if service is properly configured
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Set API key
   */
  setApiKey(key) {
    this.apiKey = key;
    this.isConfigured = !!key;
  }
}

export default TranscriptionEngine;