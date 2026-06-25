# API Reference

## Overview

The Legal Transcription App provides both REST API and WebSocket APIs for managing legal transcriptions, cases, speakers, and exports.

## Base URL

```
http://localhost:3000
ws://localhost:3000
```

## Authentication

Currently, the API does not require authentication. In production, implement JWT or API key authentication.

---

## REST API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "legal-transcription-app",
  "timestamp": "2024-06-25T13:38:00Z"
}
```

---

## Cases API

### Create Case

```http
POST /api/cases
Content-Type: application/json
```

**Request Body:**
```json
{
  "case_number": "CASE-2024-001234",
  "case_name": "Smith v. Johnson",
  "court_name": "District Court",
  "judge": "Hon. John Smith",
  "jurisdiction": "State of California",
  "date": "2024-06-25"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "caseId": "550e8400-e29b-41d4-a716-446655440000",
  "case": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "case_number": "CASE-2024-001234",
    "case_name": "Smith v. Johnson"
  }
}
```

### Get Case by ID

```http
GET /api/cases/{caseId}
```

### Get Case by Number

```http
GET /api/cases/number/{caseNumber}
```

### List Cases

```http
GET /api/cases?limit=50&offset=0
```

### Update Case

```http
PUT /api/cases/{caseId}
Content-Type: application/json
```

### Get Case Sessions

```http
GET /api/cases/{caseId}/sessions
```

### Delete Case

```http
DELETE /api/cases/{caseId}
```

---

## Speakers API

### Register Speaker

```http
POST /api/speakers/{sessionId}
Content-Type: application/json
```

### Get Speaker

```http
GET /api/speakers/{speakerId}
```

### Get Session Speakers

```http
GET /api/speakers/session/{sessionId}
```

### Update Speaker

```http
PUT /api/speakers/{speakerId}
Content-Type: application/json
```

### Verify Speaker

```http
POST /api/speakers/{speakerId}/verify
```

### Delete Speaker

```http
DELETE /api/speakers/{speakerId}
```

---

## Transcription API

### Get Transcription Session

```http
GET /api/transcriptions/{sessionId}?limit=100&offset=0
```

### Get Segment

```http
GET /api/transcriptions/{sessionId}/segment/{segmentId}
```

### Get Speaker Segments

```http
GET /api/transcriptions/{sessionId}/speaker/{speakerId}
```

### Get Objections

```http
GET /api/transcriptions/{sessionId}/objections
```

### Correct Segment

```http
POST /api/transcriptions/{sessionId}/segment/{segmentId}/correct
Content-Type: application/json
```

### Get Formatted Transcript

```http
GET /api/transcriptions/{sessionId}/formatted
```

---

## Export API

### Export Transcript

```http
POST /api/export/{sessionId}
Content-Type: application/json
```

**Supported Formats:**
- `txt` - Plain text with legal formatting
- `json` - JSON format with all metadata

### Get Export History

```http
GET /api/export/{sessionId}/history
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/transcribe');
```

### Message Types

#### Initialize Session (Client → Server)

```json
{
  "type": "init",
  "case_id": "case-id-here",
  "speakers": [
    {
      "id": "judge-001",
      "label": "THE COURT",
      "name": "Hon. John Smith",
      "role": "judge"
    }
  ]
}
```

#### Send Audio Chunk (Client → Server)

```json
{
  "type": "audio_chunk",
  "audio": "base64_encoded_audio_data",
  "speaker_id": "attorney-001",
  "timestamp": 1234567890
}
```

#### Transcript Segment (Server → Client)

```json
{
  "type": "transcript_segment",
  "segmentId": "segment-123",
  "speaker": "MR. ATTORNEY",
  "text": "The witness will now testify.",
  "formatted": "MR. ATTORNEY:\nQ: The witness will now testify.\n",
  "confidence": 0.95,
  "isObjection": false,
  "timestamp": "2024-06-25T13:45:00Z"
}
```

#### Pause Session (Client → Server)

```json
{"type": "pause"}
```

#### Resume Session (Client → Server)

```json
{"type": "resume"}
```

#### End Session (Client → Server)

```json
{"type": "end_session"}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": {
    "status": 400,
    "message": "Case number is required",
    "timestamp": "2024-06-25T13:38:00Z"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "status": 404,
    "message": "Case not found",
    "timestamp": "2024-06-25T13:38:00Z"
  }
}
```

For complete API documentation, see docs/API.md
