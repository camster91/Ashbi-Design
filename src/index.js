// Agency Hub - Main Entry Point

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { Server as SocketIO } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import inboxRoutes from './routes/inbox.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import threadRoutes from './routes/thread.routes.js';
import responseRoutes from './routes/response.routes.js';
import teamRoutes from './routes/team.routes.js';
import taskRoutes from './routes/task.routes.js';
import searchRoutes from './routes/search.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import aiRoutes from './routes/ai.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: env.isDev ? 'info' : 'warn'
  }
});

// Register plugins
await fastify.register(cors, {
  origin: env.isDev ? true : ['https://your-domain.com'],
  credentials: true
});

await fastify.register(cookie);

await fastify.register(jwt, {
  secret: env.jwtSecret,
  cookie: {
    cookieName: 'token',
    signed: false
  }
});

// Auth decorator
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Admin-only decorator
fastify.decorate('adminOnly', async (request, reply) => {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Admin access required' });
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Make prisma available in routes
fastify.decorate('prisma', prisma);

// Register API routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(webhookRoutes, { prefix: '/api/webhooks' });
await fastify.register(inboxRoutes, { prefix: '/api/inbox' });
await fastify.register(clientRoutes, { prefix: '/api/clients' });
await fastify.register(projectRoutes, { prefix: '/api/projects' });
await fastify.register(threadRoutes, { prefix: '/api/threads' });
await fastify.register(responseRoutes, { prefix: '/api/responses' });
await fastify.register(teamRoutes, { prefix: '/api/team' });
await fastify.register(taskRoutes, { prefix: '/api/tasks' });
await fastify.register(searchRoutes, { prefix: '/api/search' });
await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
await fastify.register(aiRoutes, { prefix: '/api/ai' });

// Serve static frontend in production
if (!env.isDev) {
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../web/dist'),
    prefix: '/'
  });

  // SPA fallback
  fastify.setNotFoundHandler((request, reply) => {
    if (!request.url.startsWith('/api/')) {
      return reply.sendFile('index.html');
    }
    reply.status(404).send({ error: 'Not found' });
  });
}

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Setup Socket.IO for real-time notifications
const io = new SocketIO(fastify.server, {
  cors: {
    origin: env.isDev ? '*' : ['https://your-domain.com'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally
fastify.decorate('io', io);

// Global notification helper
fastify.decorate('notify', (userId, type, data) => {
  io.to(`user:${userId}`).emit('notification', { type, data });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: env.port, host: '0.0.0.0' });
    console.log(`🚀 Agency Hub running at http://localhost:${env.port}`);
    console.log(`   Environment: ${env.nodeEnv}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

export { fastify, io };
