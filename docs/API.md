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
    "case_name": "Smith v. Johnson",
    "court_name": "District Court",
    "judge": "Hon. John Smith",
    "jurisdiction": "State of California",
    "date": "2024-06-25",
    "created_at": "2024-06-25T13:38:00Z",
    "updated_at": "2024-06-25T13:38:00Z"
  }
}
```

### Get Case

```http
GET /api/cases/{caseId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "case": { /* case object */ }
}
```

### Get Case by Number

```http
GET /api/cases/number/{caseNumber}
```

### List Cases

```http
GET /api/cases?limit=50&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 25,
  "limit": 50,
  "offset": 0,
  "cases": [ /* array of case objects */ ]
}
```

### Update Case

```http
PUT /api/cases/{caseId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "case_name": "Smith v. Johnson - Updated",
  "judge": "Hon. Jane Doe"
}
```

### Get Case Sessions

```http
GET /api/cases/{caseId}/sessions
```

**Response:**
```json
{
  "success": true,
  "sessionCount": 3,
  "sessions": [ /* array of session objects */ ]
}
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

**Request Body:**
```json
{
  "id": "speaker-001",
  "label": "MR. ATTORNEY",
  "name": "John Doe",
  "role": "attorney"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "speakerId": "550e8400-e29b-41d4-a716-446655440001",
  "speaker": { /* speaker object */ }
}
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

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "segmentCount": 25,
  "wordCount": 5430,
  "limit": 100,
  "offset": 0,
  "segments": [ /* array of segment objects */ ]
}
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

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "objectionCount": 3,
  "objections": [
    {
      "id": "segment-123",
      "text": "Objection, assumes facts not in evidence.",
      "is_objection": 1,
      "tags": "OBJECTION,OBJECTION_ASSUMES_FACTS_NOT_IN_EVIDENCE"
    }
  ]
}
```

### Correct Segment

```http
POST /api/transcriptions/{sessionId}/segment/{segmentId}/correct
Content-Type: application/json
```

**Request Body:**
```json
{
  "corrected_text": "The corrected transcript text",
  "reason": "Spelling error"
}
```

### Get Formatted Transcript

```http
GET /api/transcriptions/{sessionId}/formatted
```

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "formatted": "[formatted transcript text]",
  "segmentCount": 25
}
```

---

## Export API

### Export Transcript

```http
POST /api/export/{sessionId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "format": "txt",
  "options": {
    "pageNumbers": true,
    "timestamps": true,
    "coverPage": true
  }
}
```

**Supported Formats:**
- `txt` - Plain text with legal formatting
- `json` - JSON format with all metadata

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "format": "txt",
  "exportedAt": "2024-06-25T13:45:00Z",
  "size": 45230,
  "preview": "[first 500 characters of export]"
}
```

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
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "speakers": [
    {
      "id": "judge-001",
      "label": "THE COURT",
      "name": "Hon. John Smith",
      "role": "judge"
    },
    {
      "id": "attorney-001",
      "label": "MR. ATTORNEY",
      "name": "John Doe",
      "role": "attorney"
    }
  ]
}
```

#### Session Started (Server → Client)

```json
{
  "type": "session_started",
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "speakers": [ /* array of speaker objects */ ]
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
  "objectionType": null,
  "timestamp": "2024-06-25T13:45:00Z"
}
```

#### Pause Session (Client → Server)

```json
{
  "type": "pause"
}
```

#### Resume Session (Client → Server)

```json
{
  "type": "resume"
}
```

#### Correct Segment (Client → Server)

```json
{
  "type": "correction",
  "segment_id": "segment-123",
  "corrected_text": "The corrected text",
  "reason": "Spelling error"
}
```

#### Mark Objection (Client → Server)

```json
{
  "type": "objection_marker",
  "segment_id": "segment-123",
  "objection_type": "Assumes facts not in evidence"
}
```

#### End Session (Client → Server)

```json
{
  "type": "end_session"
}
```

#### Session Ended (Server → Client)

```json
{
  "type": "session_ended",
  "sessionId": "550e8400-e29b-41d4-a716-446655440002",
  "duration": 3600000,
  "wordCount": 5430,
  "segmentCount": 25
}
```

#### Confidence Alert (Server → Client)

```json
{
  "type": "confidence_alert",
  "confidence": 0.65,
  "segmentId": "segment-456",
  "message": "Low confidence transcription - please review"
}
```

#### Error (Server → Client)

```json
{
  "type": "error",
  "error": "Error message description"
}
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
    "message": "Case 550e8400-e29b-41d4-a716-446655440000 not found",
    "timestamp": "2024-06-25T13:38:00Z"
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "status": 500,
    "message": "An unexpected error occurred",
    "timestamp": "2024-06-25T13:38:00Z"
  }
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Production deployments should add rate limiting middleware.

## Pagination

All list endpoints support pagination:
- `limit`: Maximum results per page (default: 50, max: 100)
- `offset`: Number of results to skip (default: 0)

## Timestamps

All timestamps are in ISO 8601 format (UTC): `2024-06-25T13:38:00Z`
