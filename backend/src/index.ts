import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import path from 'path';
import './types';
import { authRoutes } from './routes/auth';
import { postRoutes } from './routes/posts';
import { pageRoutes } from './routes/pages';
import { mediaRoutes } from './routes/media';
import { userRoutes } from './routes/users';
import { prisma } from './lib/prisma';
import { createAdminUser } from './lib/setup';

const fastify = Fastify({ 
  logger: true
});

// Register plugins
fastify.register(cors, {
  origin: ['http://localhost:3000'],
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

fastify.register(multipart);

// Serve static files (uploads)
fastify.register(staticFiles, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/'
});

// Auth decorator
fastify.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(postRoutes, { prefix: '/api/posts' });
fastify.register(pageRoutes, { prefix: '/api/pages' });
fastify.register(mediaRoutes, { prefix: '/api/media' });
fastify.register(userRoutes, { prefix: '/api/users' });

// Health check
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Client logging endpoint for console forwarding
fastify.post('/api/debug/client-logs', async (request, reply) => {
  try {
    const { logs } = request.body as { logs: any[] };
    
    logs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const location = log.url ? ` (${log.url})` : '';
      let message = `[frontend] [${log.level}] ${log.message}${location}`;

      // Add stack traces if available
      if (log.stacks && log.stacks.length > 0) {
        message += '\n' + log.stacks.map((stack: string) => 
          stack.split('\n').map(line => `    ${line}`).join('\n')
        ).join('\n');
      }

      // Add extra data if available
      if (log.extra && log.extra.length > 0) {
        message += '\n    Extra data: ' + JSON.stringify(log.extra, null, 2)
          .split('\n').map(line => `    ${line}`).join('\n');
      }

      // Log to console with appropriate level
      switch (log.level) {
        case 'error':
          console.error(message);
          break;
        case 'warn':
          console.warn(message);
          break;
        case 'info':
          console.info(message);
          break;
        case 'debug':
          console.debug(message);
          break;
        default:
          console.log(message);
      }
    });

    return { success: true };
  } catch (error) {
    fastify.log.error('Error processing client logs:', error);
    return reply.status(400).send({ success: false, error: 'Invalid request' });
  }
});

const start = async () => {
  try {
    // Create admin user if it doesn't exist
    await createAdminUser();
    
    const port = parseInt(process.env.PORT || '8000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
