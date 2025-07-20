# nuCMS: TypeScript CMS with Native Gutenberg Rendering

## Project Overview

**nuCMS** is a modern content management system that combines WordPress's Gutenberg block editor with a TypeScript Node.js backend, providing native Gutenberg server-side rendering capabilities that overcome the limitations of Python-based HTML conversion.

**Key Advantages:**
- **Native Gutenberg Rendering**: Use WordPress's own block parsing packages for 100% compatible HTML output
- **Full Type Safety**: Shared TypeScript interfaces across frontend and backend


## Technology Stack

**Backend:**
- Node.js + TypeScript + Fastify
- Prisma ORM + SQLite
- WordPress block parsing packages (`@wordpress/block-serialization-default-parser`)
- JWT authentication with bcrypt

**Frontend:**
- React + TypeScript + Vite
- Full WordPress Gutenberg editor integration

**Development:**
- **Critical**: Unified logging with `shoreman` for complete agent visibility
- Hot reload for both frontend and backend
- **Important**: Only user launches `make dev`, never the agent

## Core Requirements

### 1. Database (Prisma + SQLite)
- Models: User, Post, Page, Media with relationships
- JSON column for Gutenberg blocks
- Auto-timestamps and proper foreign keys

### 2. Gutenberg Server-Side Rendering
**Must implement native WordPress block rendering:**
- Use `@wordpress/block-serialization-default-parser` for parsing
- Render all core blocks (paragraph, heading, image, list, quote, code, columns, etc.)
- Generate WordPress-compatible HTML with proper CSS classes
- Support nested blocks and complex layouts

### 3. Authentication & API
- JWT token-based auth with role permissions
- RESTful endpoints: `/auth`, `/posts`, `/pages`, `/media`
- File upload and static serving
- Zod validation and proper error handling

### 4. Frontend Integration
- React app with Gutenberg editor
- Authentication context and token management
- Media upload integration

### 5. Critical: Unified Logging for Agent Awareness
**Essential for debugging and development assistance:**
- Use `shoreman` (Procfile runner) to merge frontend and backend logs
- Logs entries bear `backend` or `frontend` to distinguish their origin
- Browser console logs forwarded to terminal using https://github.com/mitsuhiko/vite-console-forward-plugin (read documentation for setup)
- Ensure agents can see all API requests, errors, and activity in real-time
- **Important**: Agent should NEVER run `make dev` - only ask user to launch it
- When inspecting logs with `tail`, dont't use `-f` to avoid blocking the agent

## Implementation Steps

### 1. Project Setup

**Backend Dependencies:**
- fastify, @fastify/cors, @fastify/jwt, @fastify/multipart
- prisma, @prisma/client
- bcryptjs, jsonwebtoken, zod
- @wordpress/block-serialization-default-parser
- Dev: typescript, tsx, nodemon

**Frontend Dependencies:**
- react, react-dom, vite, @vitejs/plugin-react
- @wordpress/block-editor, @wordpress/block-library, @wordpress/blocks, @wordpress/components, @wordpress/data
- Dev: typescript

### 2. Key Implementation Points
- Fastify server with TypeScript, CORS, JWT middleware
- Prisma models with JSON column for blocks
- WordPress block rendering service for HTML conversion
- React app with Gutenberg editor integration
- Shared TypeScript interfaces
- Proper authentication flow with localStorage

### 3. Testing
```bash
make dev  # Start both servers with unified logging (USER ONLY - agent never runs this)
# Access: Frontend (http://localhost:3000), Backend (http://localhost:8000)
# Default login: admin/admin123
```

**Development Workflow:**
- Agent makes code changes and asks user to run `make dev` if needed
- Agent can read unified logs to debug issues
- Agent should never launch long-running processes

## Success Criteria

1. **Native Rendering**: Posts render with proper WordPress HTML structure and CSS classes
2. **SEO Extraction**: Automatic generation of meta descriptions, keywords, and reading time from blocks
3. **Full Editor**: All core Gutenberg blocks work in the editor and render correctly
4. **Type Safety**: Shared interfaces prevent type mismatches between frontend/backend
5. **Agent Visibility**: Unified logging allows complete debugging visibility
6. **WordPress Compatibility**: Future-proof as WordPress adds new blocks

This architecture provides a superior foundation compared to Python-based implementations by leveraging the WordPress ecosystem directly while maintaining modern development practices.
