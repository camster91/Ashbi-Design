// Search routes

import { prisma } from '../index.js';

export default async function searchRoutes(fastify) {
  // Global search
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    const { q, type, clientId, projectId, limit: limitParam = '20' } = request.query;
    const limit = parseInt(limitParam);

    if (!q || q.length < 2) {
      return { results: [], query: q };
    }

    const results = {
      threads: [],
      clients: [],
      projects: [],
      messages: []
    };

    // Search based on type filter or all
    const searchAll = !type;

    if (searchAll || type === 'threads') {
      const threadWhere = {
        OR: [
          { subject: { contains: q } }
        ]
      };
      if (clientId) threadWhere.clientId = clientId;
      if (projectId) threadWhere.projectId = projectId;

      results.threads = await prisma.thread.findMany({
        where: threadWhere,
        include: {
          client: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        },
        orderBy: { lastActivityAt: 'desc' },
        take: limit
      });
    }

    if (searchAll || type === 'clients') {
      results.clients = await prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { domain: { contains: q } }
          ]
        },
        take: limit
      });
    }

    if (searchAll || type === 'projects') {
      const projectWhere = {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } }
        ]
      };
      if (clientId) projectWhere.clientId = clientId;

      results.projects = await prisma.project.findMany({
        where: projectWhere,
        include: {
          client: { select: { id: true, name: true } }
        },
        take: limit
      });
    }

    if (searchAll || type === 'messages') {
      const messageWhere = {
        OR: [
          { bodyText: { contains: q } },
          { subject: { contains: q } }
        ]
      };

      results.messages = await prisma.message.findMany({
        where: messageWhere,
        include: {
          thread: {
            select: {
              id: true,
              subject: true,
              client: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { receivedAt: 'desc' },
        take: limit
      });
    }

    // Calculate total count
    const totalResults = results.threads.length +
                         results.clients.length +
                         results.projects.length +
                         results.messages.length;

    return {
      query: q,
      totalResults,
      results
    };
  });

  // Find similar threads (for knowledge recall)
  fastify.get('/similar/:threadId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { threadId } = request.params;
    const { limit: limitParam = '5' } = request.query;
    const limit = parseInt(limitParam);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        messages: { orderBy: { receivedAt: 'desc' }, take: 1 }
      }
    });

    if (!thread) {
      return reply.status(404).send({ error: 'Thread not found' });
    }

    // Simple keyword-based similarity (could be enhanced with AI embeddings)
    const keywords = extractKeywords(thread.subject + ' ' + (thread.messages[0]?.bodyText || ''));

    if (keywords.length === 0) {
      return { similar: [], threadId };
    }

    // Search for threads with similar keywords
    const similarThreads = await prisma.thread.findMany({
      where: {
        id: { not: threadId },
        OR: keywords.slice(0, 5).map(keyword => ({
          OR: [
            { subject: { contains: keyword } },
            { messages: { some: { bodyText: { contains: keyword } } } }
          ]
        }))
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { lastActivityAt: 'desc' },
      take: limit
    });

    return {
      threadId,
      keywords: keywords.slice(0, 5),
      similar: similarThreads
    };
  });

  // Natural language query (AI-powered)
  fastify.post('/ask', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { question, clientId, projectId } = request.body;

    // TODO: Implement AI-powered question answering
    // This would use Claude to understand the question and search for relevant content

    return {
      question,
      answer: 'AI-powered search coming soon',
      sources: []
    };
  });
}

// Simple keyword extraction
function extractKeywords(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
    'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
    'only', 'same', 'so', 'than', 'too', 'very', 'just', 'hi', 'hello',
    'thanks', 'thank', 'please', 'regards', 'best', 'team'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 20);
}
