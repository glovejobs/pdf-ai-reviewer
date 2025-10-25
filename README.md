# AI Content Review & Rating System

A comprehensive AI-powered content review system that analyzes PDFs for explicit content, violence, and offensive language, providing detailed ratings based on a 0-5 scale.

## Features

- **PDF Upload & Processing**: Drag-and-drop interface for PDF documents
- **AI-Powered Analysis**: Uses OpenAI's moderation API and Claude 3.5 Sonnet for intelligent content classification
- **Comprehensive Rating System**: 0-5 rating scale aligned with "Comprehensive Content Based Rating Scale"
- **Detailed Reports**: Category breakdowns, flagged terms, and evidence excerpts
- **Multiple Export Formats**: JSON, CSV, and Markdown report exports
- **Real-time Progress Tracking**: Live updates during document processing

## Tech Stack

### Backend
- **Framework**: Fastify (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **AI Models**:
  - OpenAI `omni-moderation-latest` for content classification
  - Anthropic Claude 3.5 Sonnet for rubric mapping and summarization
- **PDF Processing**: pdf-parse for text extraction
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **UI Components**: Custom components with lucide-react icons

## Architecture

### Processing Pipeline

1. **Text Extraction**: PDF → text extraction with page tracking
2. **Chunking**: Split into 8-10k token chunks with 1k overlap
3. **Classification**: OpenAI moderation API for explicit content detection
4. **Rubric Mapping**: Claude 3.5 Sonnet maps scores to 0-5 rating scale
5. **Term Counting**: Regex-based flagged term detection
6. **Aggregation**: Combine chunk results into final document rating
7. **Report Generation**: Structured report with evidence and rationale

### Rating Scale

- **0 - All Ages**: No profanity, nudity, or violence
- **1 - Juvenile Advisory**: Mild references, no explicit acts
- **2 - Youth Advisory**: Moderate violence, explicit ideologies
- **3 - Youth Restricted**: Explicit references, moderate nudity
- **4 - Adults Only**: Graphic acts, strong profanity, gore
- **5 - Deviant Content**: Aberrant content, sexual assault, extreme violence

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- OpenAI API key
- Anthropic API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_content_review
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=3001
FRONTEND_URL=http://localhost:3000
```

5. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Configure API URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

5. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Documents

- `POST /api/documents` - Upload a new document
- `GET /api/documents` - List all documents
- `GET /api/documents/:id/status` - Get processing status
- `GET /api/documents/:id/result` - Get analysis results
- `POST /api/documents/:id/ingest` - Manually trigger ingestion

### Reports

- `POST /api/reports/:id/export` - Export report (JSON, CSV, Markdown)
- `GET /api/reports/:id/preview` - Preview report

### Term Lists

- `GET /api/term-lists` - Get all term lists
- `POST /api/term-lists` - Create term list
- `PUT /api/term-lists/:id` - Update term list
- `DELETE /api/term-lists/:id` - Delete term list

### Templates

- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get specific template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

## Database Schema

Key tables:
- `documents` - Document metadata and status
- `chunks` - Text chunks from documents
- `chunk_results` - AI analysis results per chunk
- `doc_results` - Aggregated document results
- `jobs` - Processing job tracking
- `term_lists` - Custom flagged term dictionaries
- `templates` - Export format templates
- `audit_logs` - User action tracking

## Usage

1. **Upload Document**: Drag and drop a PDF file or click to browse
2. **Monitor Progress**: Watch real-time processing status
3. **View Results**: See overall rating, category scores, and flagged content
4. **Export Report**: Download results in JSON, CSV, or Markdown format

## Project Structure

```
/backend
  /src
    /config       - Configuration and constants
    /routes       - API route handlers
    /services     - Business logic (extraction, classification, rubric mapping)
    /models       - Data models (via Prisma)
    /utils        - Utility functions
  /prisma         - Database schema and migrations

/frontend
  /src
    /app          - Next.js app router pages
    /components   - React components
    /lib          - API client and utilities
    /types        - TypeScript type definitions

/data             - Sample data and test files
/prompts          - AI prompt templates
/tests            - Test files
```

## Development

### Run Tests
```bash
cd backend
npm test
```

### Database Management
```bash
# Open Prisma Studio
npm run prisma:studio

# Create new migration
npm run prisma:migrate
```

## Deployment

### Backend
- **Recommended**: Railway, Render, or Fly.io
- **Database**: Supabase, Neon, or managed PostgreSQL
- Set environment variables in deployment platform

### Frontend
- **Recommended**: Vercel or Netlify
- Set `NEXT_PUBLIC_API_URL` to production backend URL

## Performance

- Processes ~300-page PDF in 3-6 minutes
- Concurrent chunk processing with rate limiting
- Automatic retries for failed operations
- Progress tracking for long-running analyses

## Security

- Encrypted uploads (HTTPS)
- API key validation
- Rate limiting on endpoints
- Audit logging for all operations
- Optional PII scrubbing

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
