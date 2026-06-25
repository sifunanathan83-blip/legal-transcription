# Setup Guide

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm** or **yarn**: Package manager
- **Git**: For cloning the repository
- **API Keys** (optional): Google Cloud Speech-to-Text or Azure Speech API

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

Or with yarn:

```bash
yarn install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Transcription Service
TRANSCRIPTION_SERVICE=mock  # or 'google', 'azure'

# Google Cloud (if using Google service)
GOOGLE_API_KEY=your_google_api_key_here

# Azure (if using Azure service)
AZURE_SPEECH_KEY=your_azure_key_here
AZURE_SPEECH_REGION=eastus

# Logging
LOG_LEVEL=info

# Features
ENABLE_SPEAKER_DETECTION=true
ENABLE_TIMESTAMPS=true
```

### 4. Start Development Server

```bash
npm run dev
```

You should see:

```
🎙️  Legal Transcription App running on port 3000
Environment: development
✅ WebSocket server ready at ws://localhost:3000/transcribe
```

### 5. Verify Installation

Check health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "legal-transcription-app",
  "timestamp": "2024-06-25T13:38:00Z"
}
```

---

## Configuration

### Transcription Service Selection

#### Mock Service (Default)

For development and testing:

```env
TRANSCRIPTION_SERVICE=mock
```

#### Google Cloud Speech-to-Text

1. Create a Google Cloud project
2. Enable Speech-to-Text API
3. Create a service account and download JSON key
4. Set environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

5. In `.env`:

```env
TRANSCRIPTION_SERVICE=google
GOOGLE_API_KEY=your_api_key_from_gcp
```

#### Azure Cognitive Services

1. Create Azure Speech resource
2. Get API key and region
3. In `.env`:

```env
TRANSCRIPTION_SERVICE=azure
AZURE_SPEECH_KEY=your_api_key
AZURE_SPEECH_REGION=eastus
```

### Database

The app uses SQLite by default (file-based, no setup required).

Database file location: `./legal_transcription.db`

Tables are automatically created on first run.

### Logging

Logs are stored in:
- `./logs/app.log` - Application logs
- `./logs/error.log` - Error logs only

Set log level in `.env`:

```env
LOG_LEVEL=debug    # Verbose
LOG_LEVEL=info     # Normal (default)
LOG_LEVEL=warn     # Warnings only
LOG_LEVEL=error    # Errors only
```

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm test -- --coverage
```

---

## Development Workflow

### Hot Reload

The dev server uses `nodemon` for automatic reload:

```bash
npm run dev
```

Changes to files in `src/` automatically reload the server.

### Code Formatting

```bash
npm run format
```

Automatic formatting with Prettier.

### Linting

```bash
npm run lint
```

Check code with ESLint.

---

## Docker Deployment

### Build Image

```bash
docker build -t legal-transcription-app .
```

### Run Container

```bash
docker run -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/legal_transcription.db:/app/legal_transcription.db \
  legal-transcription-app
```

---

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique API keys
- [ ] Enable HTTPS/WSS (reverse proxy with SSL)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure authentication (JWT or API keys)
- [ ] Set up automated backups
- [ ] Configure logging aggregation (ELK, CloudWatch, etc.)
- [ ] Enable monitoring and alerts
- [ ] Set up CI/CD pipeline
- [ ] Regular security audits

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
TRANSCRIPTION_SERVICE=google
GOOGLE_API_KEY=<secure-key>
LOG_LEVEL=warn
ENABLE_HTTPS=true
```

### Nginx Reverse Proxy Configuration

```nginx
upstream legal_transcription {
  server localhost:3000;
}

server {
  listen 443 ssl http2;
  server_name transcription.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  location / {
    proxy_pass http://legal_transcription;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Locked

```bash
# Remove database and restart
rm legal_transcription.db
npm run dev
```

### WebSocket Connection Failed

- Check firewall allows WebSocket connections
- Verify WSS (secure WebSocket) if using HTTPS
- Check browser console for specific errors

### Low Transcription Confidence

- Check audio quality
- Verify correct language code in config
- Review audio encoding format

### Missing Modules

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

1. Review [API.md](./API.md) for endpoint documentation
2. Check [EXAMPLES.md](./EXAMPLES.md) for usage examples
3. Read [TRANSCRIPTION_RULES.md](./TRANSCRIPTION_RULES.md) for formatting guidelines

---

## Support

For issues and questions:
1. Check existing GitHub issues
2. Review logs in `./logs/`
3. Open a new GitHub issue with detailed information

## License

MIT License - See LICENSE file
