# Setup Guide

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm** or **yarn**: Package manager
- **Git**: For cloning the repository

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/sifunanathan83-blip/legal-transcription.git
cd legal-transcription
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
TRANSCRIPTION_SERVICE=mock
```

### 4. Start Development Server

```bash
npm run dev
```

You should see:

```
🎙️  Legal Transcription App running on port 3000
✅ WebSocket server ready at ws://localhost:3000/transcribe
```

### 5. Verify Installation

Check health endpoint:

```bash
curl http://localhost:3000/health
```

## Configuration

### Transcription Service Selection

#### Mock Service (Default)

For development and testing:

```env
TRANSCRIPTION_SERVICE=mock
```

#### Google Cloud Speech-to-Text

```env
TRANSCRIPTION_SERVICE=google
GOOGLE_API_KEY=your_api_key_from_gcp
```

#### Azure Cognitive Services

```env
TRANSCRIPTION_SERVICE=azure
AZURE_SPEECH_KEY=your_api_key
AZURE_SPEECH_REGION=eastus
```

## Running Tests

```bash
npm test
npm run test:watch
```

## Development Workflow

### Hot Reload

```bash
npm run dev
```

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

## Docker Deployment

### Build Image

```bash
docker build -t legal-transcription-app .
```

### Run Container

```bash
docker run -p 3000:3000 --env-file .env legal-transcription-app
```

## Troubleshooting

### Port Already in Use

```bash
PORT=3001 npm run dev
```

### Database Locked

```bash
rm legal_transcription.db
npm run dev
```

### WebSocket Connection Failed

- Check firewall allows WebSocket connections
- Verify correct server URL
- Check browser console for errors

For detailed setup instructions, see docs/SETUP.md
