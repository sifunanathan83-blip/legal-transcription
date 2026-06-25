# Examples

## Creating a Case

### REST API

```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "case_number": "CASE-2024-001234",
    "case_name": "Smith v. Johnson",
    "court_name": "District Court"
  }'
```

### JavaScript

```javascript
const axios = require('axios');

async function createCase() {
  const response = await axios.post('http://localhost:3000/api/cases', {
    case_number: 'CASE-2024-001234',
    case_name: 'Smith v. Johnson',
    court_name: 'District Court'
  });
  
  console.log('Case created:', response.data.caseId);
}
```

## Starting a Live Transcription Session

### JavaScript (Browser)

```javascript
const ws = new WebSocket('ws://localhost:3000/transcribe');

ws.onopen = () => {
  console.log('Connected');
  
  // Initialize session
  ws.send(JSON.stringify({
    type: 'init',
    case_id: 'CASE-2024-001234',
    speakers: [
      { id: 'judge-001', label: 'THE COURT', name: 'Hon. John Smith', role: 'judge' },
      { id: 'attorney-001', label: 'MR. ATTORNEY', name: 'John Doe', role: 'attorney' }
    ]
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'transcript_segment') {
    console.log(`${message.speaker}: ${message.text}`);
  } else if (message.type === 'session_started') {
    console.log('Session started:', message.sessionId);
  }
};
```

## Sending Audio

### Browser with MediaRecorder

```javascript
const mediaRecorder = new MediaRecorder(stream);
const chunks = [];

mediaRecorder.ondataavailable = (event) => {
  chunks.push(event.data);
};

mediaRecorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  ws.send(JSON.stringify({
    type: 'audio_chunk',
    audio: base64,
    speaker_id: 'attorney-001',
    timestamp: Date.now()
  }));
};
```

## Handling Objections

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.isObjection) {
    console.log('⚠️ OBJECTION DETECTED');
    console.log(`Type: ${message.objectionType}`);
    console.log(`Text: ${message.text}`);
  }
};
```

## Correcting Segments

### WebSocket

```javascript
ws.send(JSON.stringify({
  type: 'correction',
  segment_id: 'segment-123',
  corrected_text: 'The corrected text',
  reason: 'Spelling error'
}));
```

### REST API

```bash
curl -X POST http://localhost:3000/api/transcriptions/session-001/segment/segment-123/correct \
  -H "Content-Type: application/json" \
  -d '{
    "corrected_text": "The corrected text",
    "reason": "Spelling error"
  }'
```

## Exporting Transcripts

```javascript
async function exportTranscript(sessionId) {
  const response = await fetch(
    `http://localhost:3000/api/export/${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'txt',
        options: { pageNumbers: true, timestamps: true }
      })
    }
  );
  
  const result = await response.json();
  console.log('Exported:', result.size, 'bytes');
}
```

## Quick Start Command Line

### 1. Start Server

```bash
npm run dev
```

### 2. Create Case

```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "case_number": "TEST-2024-001",
    "case_name": "Test Case",
    "court_name": "District Court"
  }'
```

### 3. Test WebSocket

```bash
wscat -c ws://localhost:3000/transcribe
```

Then send:

```json
{
  "type": "init",
  "case_id": "CASE-2024-001234",
  "speakers": [
    {"id": "judge-001", "label": "THE COURT", "name": "Judge", "role": "judge"}
  ]
}
```

For comprehensive examples, see docs/EXAMPLES.md
