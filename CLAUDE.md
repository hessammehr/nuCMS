# nuCMS Agent Guide

This file contains essential information for AI agents working on the nuCMS project.

## Quick Commands

### Development
```bash
make dev          # Start both frontend and backend with unified logging (USER ONLY)
make install      # Install all dependencies
make setup        # Set up database and create admin user
make logs         # Show development logs (use instead of tail -f)
make kill-dev     # Stop all development processes
```

### Database
```bash
cd backend && npm run db:generate  # Generate Prisma client
cd backend && npm run db:push      # Push schema to database
cd backend && npm run db:studio    # Open Prisma Studio
```

### Testing & Quality
```bash
make check        # Run linting and type checking
make format       # Format code
make test         # Run tests
make build        # Build frontend for production
```

## Project Structure

```
nu_cms/
├── backend/                 # Fastify TypeScript backend
│   ├── src/
│   │   ├── index.ts        # Main server entry point
│   │   ├── lib/
│   │   │   ├── prisma.ts   # Database client
│   │   │   ├── gutenberg.ts # WordPress block rendering
│   │   │   └── setup.ts    # Admin user creation
│   │   └── routes/         # API route handlers
│   │       ├── auth.ts     # Authentication (login, me, refresh)
│   │       ├── posts.ts    # Post CRUD operations
│   │       ├── pages.ts    # Page CRUD operations
│   │       └── media.ts    # File upload and management
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── uploads/            # File upload directory
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx  # Navigation header
│   │   │   └── GutenbergEditor.tsx # WordPress block editor
│   │   ├── pages/          # Route components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Posts.tsx & PostEditor.tsx
│   │   │   ├── Pages.tsx & PageEditor.tsx
│   │   │   └── Media.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # JWT authentication
│   │   └── utils/
│   │       ├── api.ts      # Axios HTTP client
│   │       └── wordpress.ts # WordPress packages init
│   └── vite.config.ts      # Vite config with console forwarding
├── shared/
│   └── types/index.ts      # Shared TypeScript interfaces
└── scripts/
    └── shoreman.sh         # Process manager for unified logging
```

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify (web server)
- **Database**: SQLite + Prisma ORM
- **Authentication**: JWT with bcrypt
- **Block Rendering**: @wordpress/block-serialization-default-parser
- **File Uploads**: @fastify/multipart + @fastify/static

### Frontend
- **Framework**: React + TypeScript + Vite
- **Editor**: Full WordPress Gutenberg (@wordpress/block-editor)
- **Routing**: React Router DOM
- **HTTP**: Axios with interceptors
- **Styling**: Vanilla CSS with WordPress block styles

### Development
- **Process Manager**: shoreman (Procfile runner)
- **Logging**: Unified console forwarding from browser to terminal
- **Hot Reload**: Both frontend (Vite) and backend (tsx watch)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh JWT token

### Posts
- `GET /api/posts` - List posts (paginated, filterable)
- `GET /api/posts/:id` - Get single post with rendered HTML + SEO data
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Pages
- `GET /api/pages` - List pages (paginated, filterable)
- `GET /api/pages/:id` - Get single page with rendered HTML + SEO data
- `POST /api/pages` - Create new page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page

### Media
- `GET /api/media` - List media files (paginated, filterable)
- `GET /api/media/:id` - Get single media file
- `POST /api/media/upload` - Upload files (multipart/form-data)
- `PUT /api/media/:id` - Update media metadata (alt, caption)
- `DELETE /api/media/:id` - Delete media file

## Default Credentials

- **Username**: admin
- **Password**: admin123
- **Email**: admin@nucms.local

## Development Workflow

1. **Starting Development**: User runs `make dev` (NEVER the agent)
2. **Making Changes**: Agent can modify any files
3. **Viewing Logs**: Agent uses `make logs` or checks unified output from shoreman (dev.log) looking for `backend` or `frontend` tags
4. **Database Changes**: Agent can modify schema and run `npm run db:push` in backend
5. **Debugging**: All browser console logs appear in terminal via console forwarding

## Important Notes

### For Agents
- **NEVER run `make dev`** - only ask user to launch it
- Don't use `tail dev.log` with the `-f` option to avoid blocking
- Backend runs on port 8000, frontend on port 3000
- All API requests proxy through Vite dev server
- WordPress packages initialize automatically on frontend startup

### Gutenberg Editor
- Full WordPress block editor with all core blocks
- Native WordPress block parsing and rendering on backend
- Blocks stored as WordPress-compatible HTML with comment delimiters
- SEO data auto-extracted from block content (description, reading time, keywords)

### File Uploads
- Allowed types: images (JPEG, PNG, GIF, WebP, SVG), PDF, text files
- Max size: 10MB per file
- Files served from `/uploads/` static route
- Media metadata (alt text, captions) stored in database

### Authentication
- JWT tokens with 7-day expiration
- Automatic token refresh on API requests
- Role-based permissions (ADMIN, EDITOR, AUTHOR)
- Tokens stored in localStorage with automatic cleanup

## Troubleshooting

### Database Issues
```bash
cd backend
npm run db:push  # Reset database to schema
npm run setup    # Recreate admin user
```

### Port Conflicts
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/vite.config.ts

### Console Forwarding Not Working
- Check vite-console-forward-plugin is installed
- Verify plugin config in frontend/vite.config.ts
- Restart development servers

### WordPress Packages Issues
- Ensure all @wordpress/* packages are same version
- Check initializeWordPress() is called in main.tsx
- Verify block registration in browser console

## Development Tips

- **Logging Tips**:
  - `make logs` is interactive. Use tail and grep to filter and navigate logs