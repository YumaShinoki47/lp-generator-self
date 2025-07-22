# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an LP (Landing Page) generator that uses AI to automatically create landing pages. The application consists of a Python FastAPI backend that handles AI agents for generating HTML, CSS, JavaScript, and images, and a React TypeScript frontend with shadcn/ui components.

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- shadcn/ui components
- TailwindCSS v4
- React Hook Form with Zod validation
- pnpm package manager

**Backend:**
- Python FastAPI
- Google Gemini AI (for text generation)
- Claude 3.7 Sonnet (alternative text generation)
- Google Imagen3 (for image generation)
- Ray (for parallel processing)
- Uvicorn (ASGI server)

## Development Commands

**Frontend (from `/frontend` directory):**
```bash
pnpm dev          # Start development server (Vite)
pnpm build        # Build for production (TypeScript check + Vite build)
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

**Backend (from `/backend` directory):**
```bash
python main.py    # Start FastAPI server on localhost:8000
```

**Full Stack Development:**
- Frontend runs on `http://localhost:5173` (Vite default)
- Backend runs on `http://localhost:8000`
- API endpoints are prefixed with `/api`

## Architecture

### Backend Structure
The backend follows a multi-agent architecture where each agent handles a specific part of LP generation:

1. **Wireframe Agent** (`wireframe_generate_agent`) - Generates HTML structure
2. **CSS Design Agent** (`design_css_agent`) - Creates styling
3. **JavaScript Agent** (`design_js_agent`) - Adds interactivity
4. **Image Generation Agent** (`image_generate_agent`) - Creates AI images
5. **Image Application Agent** (`apply_image`) - Integrates images into the LP

### Frontend Structure
- **App.tsx** - Main application component with form handling and job status polling
- **services/api.ts** - API client for backend communication
- **types/types.ts** - TypeScript type definitions
- **components/ui/** - shadcn/ui component library

### Job Processing Flow
1. User submits LP requirements via form
2. Backend creates a job with unique ID
3. Background task processes through 5 generation steps
4. Frontend polls job status every 3 seconds
5. Completed LP is displayed in iframe preview

## Important Implementation Details

### Environment Variables
Backend requires:
- `GEMINI_API_KEY` - For Google Gemini AI
- `ANTHROPIC_API_KEY` - For Claude API (alternative)

### File Structure Patterns
- Generated LPs are stored in `jobs/{job_id}/` directories
- Each job produces: `index.html`, `style.css`, `script.js`, and image files
- Downloadable ZIP files are created as `download-{job_id}.zip`

### API Endpoints
- `POST /api/generate` - Start LP generation job
- `GET /api/jobs/{job_id}` - Get job status
- `GET /api/jobs/{job_id}/download` - Download generated files
- `POST /api/jobs/{job_id}/retry` - Retry failed job

### Frontend Patterns
- Uses React Hook Form with Zod schema validation
- All form fields are required with Japanese labels
- Job status polling implemented with setInterval
- Preview updates via iframe content manipulation

## Development Guidelines

### UI/UX Constraints
- Do not modify UI design (layout, colors, fonts, spacing) without explicit approval
- Maintain consistency with existing shadcn/ui component usage
- Keep Japanese language interface

### Code Style
- Follow existing TypeScript patterns in frontend
- Use absolute imports with `@/` prefix
- Maintain FastAPI async/await patterns in backend
- Follow shadcn/ui component composition patterns