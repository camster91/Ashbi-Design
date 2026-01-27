// Client routes

import { prisma } from '../index.js';

export default async function clientRoutes(fastify) {
  // List all clients
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    const { status, search } = request.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { domain: { contains: search } }
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            projects: true,
            threads: true,
            contacts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return clients;
  });

  // Create client
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { name, domain, status = 'ACTIVE' } = request.body;

    // Check for duplicate domain
    if (domain) {
      const existing = await prisma.client.findUnique({
        where: { domain }
      });
      if (existing) {
        return reply.status(400).send({ error: 'Client with this domain already exists' });
      }
    }

    const client = await prisma.client.create({
      data: { name, domain, status }
    });

    return reply.status(201).send(client);
  });

  // Get single client with full details
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        projects: {
          include: {
            _count: {
              select: { threads: true, tasks: true }
            }
          }
        },
        threads: {
          orderBy: { lastActivityAt: 'desc' },
          take: 10,
          include: {
            project: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!client) {
      return reply.status(404).send({ error: 'Client not found' });
    }

    // Parse JSON fields
    return {
      ...client,
      communicationPrefs: JSON.parse(client.communicationPrefs),
      satisfactionSignals: JSON.parse(client.satisfactionSignals),
      knowledgeBase: JSON.parse(client.knowledgeBase)
    };
  });

  // Update client
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, domain, status, communicationPrefs, knowledgeBase } = request.body;

    const data = {};
    if (name) data.name = name;
    if (domain !== undefined) data.domain = domain;
    if (status) data.status = status;
    if (communicationPrefs) data.communicationPrefs = JSON.stringify(communicationPrefs);
    if (knowledgeBase) data.knowledgeBase = JSON.stringify(knowledgeBase);

    const client = await prisma.client.update({
      where: { id },
      data
    });

    return client;
  });

  // Get client contacts
  fastify.get('/:id/contacts', {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    const { id } = request.params;

    const contacts = await prisma.contact.findMany({
      where: { clientId: id },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ]
    });

    return contacts;
  });

  // Add contact to client
  fastify.post('/:id/contacts', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { email, name, role, isPrimary = false } = request.body;

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { clientId: id, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    const contact = await prisma.contact.create({
      data: {
        email,
        name,
        role,
        isPrimary,
        clientId: id
      }
    });

    return reply.status(201).send(contact);
  });

  // Get client insights (AI-generated)
  fastify.get('/:id/insights', {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    const { id } = request.params;

    // Get recent threads for analysis
    const recentThreads = await prisma.thread.findMany({
      where: { clientId: id },
      orderBy: { lastActivityAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { receivedAt: 'desc' },
          take: 1
        }
      }
    });

    // Calculate basic insights
    const sentimentCounts = recentThreads.reduce((acc, t) => {
      if (t.sentiment) {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
      }
      return acc;
    }, {});

    const priorityCounts = recentThreads.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      recentThreadCount: recentThreads.length,
      sentimentBreakdown: sentimentCounts,
      priorityBreakdown: priorityCounts,
      avgResponseTime: null, // TODO: Calculate
      satisfactionTrend: 'stable' // TODO: Calculate from sentiment
    };
  });
}
