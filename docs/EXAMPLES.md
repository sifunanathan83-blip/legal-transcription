# Examples

## Table of Contents

1. [Creating a Case](#creating-a-case)
2. [Starting a Live Transcription Session](#starting-a-live-transcription-session)
3. [Sending Audio](#sending-audio)
4. [Handling Objections](#handling-objections)
5. [Correcting Segments](#correcting-segments)
6. [Exporting Transcripts](#exporting-transcripts)
7. [Client Implementation](#client-implementation)

---

## Creating a Case

### REST API

```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "case_number": "CASE-2024-001234",
    "case_name": "Smith v. Johnson",
    "court_name": "District Court",
    "judge": "Hon. John Smith",
    "jurisdiction": "State of California",
    "date": "2024-06-25"
  }'
```

### JavaScript

```javascript
const axios = require('axios');

async function createCase() {
  const response = await axios.post('http://localhost:3000/api/cases', {
    case_number: 'CASE-2024-001234',
    case_name: 'Smith v. Johnson',
    court_name: 'District Court',
    judge: 'Hon. John Smith',
    jurisdiction: 'State of California',
    date: '2024-06-25'
  });

  console.log('Case created:', response.data.caseId);
  return response.data.caseId;
}

creatCase();
```

---

## Starting a Live Transcription Session

### JavaScript (Browser)

```javascript
class LegalTranscriptionClient {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.isRecording = false;
  }

  connect(caseId, speakers) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:3000/transcribe');

      this.ws.onopen = () => {
        console.log('Connected to transcription server');
        this.initSession(caseId, speakers);
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from server');
      };
    });
  }

  initSession(caseId, speakers) {
    const message = {
      type: 'init',
      case_id: caseId,
      speakers: speakers.map(speaker => ({
        id: speaker.id,
        label: speaker.label,
        name: speaker.name,
        role: speaker.role
      }))
    };

    this.ws.send(JSON.stringify(message));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'session_started':
        console.log('Session started:', message.sessionId);
        this.sessionId = message.sessionId;
        break;

      case 'transcript_segment':
        this.displaySegment(message);
        break;

      case 'confidence_alert':
        console.warn('Low confidence:', message.confidence);
        break;

      case 'error':
        console.error('Server error:', message.error);
        break;
    }
  }

  displaySegment(segment) {
    console.log(`${segment.speaker}:`);
    console.log(segment.text);
    console.log(`Confidence: ${(segment.confidence * 100).toFixed(1)}%`);
    console.log('---');
  }
}

// Usage
const client = new LegalTranscriptionClient();
const caseId = 'CASE-2024-001234';
const speakers = [
  { id: 'judge-001', label: 'THE COURT', name: 'Hon. John Smith', role: 'judge' },
  { id: 'attorney-001', label: 'MR. ATTORNEY', name: 'John Doe', role: 'attorney' },
  { id: 'witness-001', label: 'MR. WITNESS', name: 'Robert Johnson', role: 'witness' }
];

client.connect(caseId, speakers).then(() => {
  console.log('Ready to transcribe');
});
```

---

## Sending Audio

### Browser with MediaRecorder API

```javascript
class AudioRecorder {
  constructor(client) {
    this.client = client;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.chunks = [];
  }

  async startRecording(speakerId) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.chunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      this.sendAudio(speakerId);
    };

    this.mediaRecorder.start();
    console.log('Recording started');
  }

  stopRecording() {
    this.mediaRecorder.stop();
    console.log('Recording stopped');
  }

  async sendAudio(speakerId) {
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const message = {
      type: 'audio_chunk',
      audio: base64,
      speaker_id: speakerId,
      timestamp: Date.now()
    };

    this.client.ws.send(JSON.stringify(message));
  }
}

// Usage
const recorder = new AudioRecorder(client);

// Start recording
document.getElementById('startBtn').onclick = () => {
  recorder.startRecording('attorney-001');
};

// Stop recording
document.getElementById('stopBtn').onclick = () => {
  recorder.stopRecording();
};
```

---

## Handling Objections

### Detect Objections

```javascript
function handleObjection(segment) {
  if (segment.isObjection) {
    console.log('🚨 OBJECTION DETECTED');
    console.log(`Speaker: ${segment.speaker}`);
    console.log(`Type: ${segment.objectionType}`);
    console.log(`Text: ${segment.text}`);

    // Highlight in UI
    displayObjectionAlert(segment);
  }
}

function displayObjectionAlert(segment) {
  const alert = document.createElement('div');
  alert.className = 'objection-alert';
  alert.innerHTML = `
    <strong>⚠️ Objection:</strong> ${segment.objectionType}
    <br/>
    <em>${segment.text}</em>
  `;
  document.body.appendChild(alert);

  // Auto-dismiss after 5 seconds
  setTimeout(() => alert.remove(), 5000);
}
```

### Mark Objection via API

```javascript
async function markObjection(sessionId, segmentId, objectionType) {
  const response = await fetch(
    `http://localhost:3000/api/transcriptions/${sessionId}/segment/${segmentId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'objection_marker',
        segment_id: segmentId,
        objection_type: objectionType
      })
    }
  );

  return response.json();
}
```

---

## Correcting Segments

### WebSocket Correction

```javascript
function correctSegment(segmentId, correctedText, reason) {
  const message = {
    type: 'correction',
    segment_id: segmentId,
    corrected_text: correctedText,
    reason: reason
  };

  client.ws.send(JSON.stringify(message));
}

// Usage
correctSegment(
  'segment-123',
  'The corrected transcript text',
  'Spelling error'
);
```

### REST API Correction

```bash
curl -X POST http://localhost:3000/api/transcriptions/session-001/segment/segment-123/correct \
  -H "Content-Type: application/json" \
  -d '{
    "corrected_text": "The corrected transcript text",
    "reason": "Spelling error"
  }'
```

---

## Exporting Transcripts

### Export as Text

```javascript
async function exportTranscript(sessionId) {
  const response = await fetch(
    `http://localhost:3000/api/export/${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'txt',
        options: {
          pageNumbers: true,
          timestamps: true,
          coverPage: true
        }
      })
    }
  );

  const result = await response.json();
  console.log('Export completed');
  console.log('Size:', result.size, 'bytes');
  console.log('Preview:', result.preview);
}
```

### Export as JSON

```javascript
async function exportAsJSON(sessionId) {
  const response = await fetch(
    `http://localhost:3000/api/export/${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'json' })
    }
  );

  const result = await response.json();
  return result;
}
```

### Download Export

```javascript
async function downloadTranscript(sessionId, format = 'txt') {
  const response = await fetch(
    `http://localhost:3000/api/export/${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format })
    }
  );

  const data = await response.json();

  // Create download link
  const blob = new Blob([data.preview], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript-${sessionId}.${format}`;
  a.click();
}
```

---

## Client Implementation

### Complete HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legal Transcription Client</title>
  <style>
    body {
      font-family: Courier, monospace;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    .controls {
      margin-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      margin: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .transcript {
      border: 1px solid #ccc;
      padding: 20px;
      background: #f9f9f9;
      max-height: 500px;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.6;
    }
    .segment {
      margin-bottom: 15px;
    }
    .speaker {
      font-weight: bold;
      color: #0066cc;
    }
    .objection {
      background: #fff3cd;
      padding: 5px 10px;
      border-left: 3px solid #ff9800;
      margin: 5px 0;
    }
    .status {
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
      background: #e8f5e9;
      color: #2e7d32;
    }
  </style>
</head>
<body>
  <h1>🎙️ Legal Transcription Client</h1>

  <div class="status" id="status">Disconnected</div>

  <div class="controls">
    <input type="text" id="caseId" placeholder="Case ID" value="CASE-2024-001234">
    <select id="speaker">
      <option value="judge-001">THE COURT (Judge)</option>
      <option value="attorney-001">MR. ATTORNEY (Attorney)</option>
      <option value="witness-001">MR. WITNESS (Witness)</option>
    </select>
    <button onclick="connect()" id="connectBtn">Connect</button>
    <button onclick="startRecording()" id="startBtn" disabled>Start Recording</button>
    <button onclick="stopRecording()" id="stopBtn" disabled>Stop Recording</button>
    <button onclick="endSession()" id="endBtn" disabled>End Session</button>
    <button onclick="exportTranscript()" id="exportBtn" disabled>Export</button>
  </div>

  <div class="transcript" id="transcript"></div>

  <script src="client.js"></script>
</body>
</html>
```

---

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
  "case_id": "CASE-ID-HERE",
  "speakers": [
    {"id": "judge-001", "label": "THE COURT", "name": "Judge", "role": "judge"}
  ]
}
```

---

## Integration with Frontend Framework

### React Example

```jsx
import React, { useState, useEffect } from 'react';

const TranscriptionComponent = () => {
  const [transcript, setTranscript] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000/transcribe');

    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'transcript_segment') {
        setTranscript(prev => [...prev, message]);
      }
    };

    websocket.onclose = () => setIsConnected(false);

    return () => websocket.close();
  }, []);

  const handleInitSession = (caseId) => {
    if (!ws) return;

    ws.send(JSON.stringify({
      type: 'init',
      case_id: caseId,
      speakers: [
        { id: 'judge-001', label: 'THE COURT', name: 'Judge', role: 'judge' }
      ]
    }));
  };

  return (
    <div>
      <h1>Legal Transcription</h1>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <div>
        {transcript.map((segment, index) => (
          <div key={index}>
            <strong>{segment.speaker}:</strong>
            <p>{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionComponent;
```

---

For more detailed examples and integration guides, see the main documentation.
