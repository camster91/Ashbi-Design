// Authentication routes

import { prisma } from '../index.js';
import crypto from 'crypto';

// Simple password hashing (use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

export default async function authRoutes(fastify) {
  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !verifyPassword(password, user.password)) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return reply.status(401).send({ error: 'Account is disabled' });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    reply
      .setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && !request.headers.host?.includes('localhost'),
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })
      .send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    reply
      .clearCookie('token', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production' && !request.headers.host?.includes('localhost'), sameSite: 'lax' })
      .send({ success: true });
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        skills: true,
        capacity: true
      }
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return user;
  });

  // Register (admin only, or first user)
  fastify.post('/register', async (request, reply) => {
    const { email, password, name, role = 'TEAM' } = request.body;

    // Check if any users exist
    const userCount = await prisma.user.count();

    // If users exist, require admin auth
    if (userCount > 0) {
      try {
        await request.jwtVerify();
        if (request.user.role !== 'ADMIN') {
          return reply.status(403).send({ error: 'Admin access required' });
        }
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' });
    }

    // First user is always admin
    const userRole = userCount === 0 ? 'ADMIN' : role;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        name,
        role: userRole
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return reply.status(201).send(user);
  });

  // Change password
  fastify.post('/change-password', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;

    const user = await prisma.user.findUnique({
      where: { id: request.user.id }
    });

    if (!verifyPassword(currentPassword, user.password)) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    await prisma.user.update({
      where: { id: request.user.id },
      data: { password: hashPassword(newPassword) }
    });

    return { success: true };
  });
}
