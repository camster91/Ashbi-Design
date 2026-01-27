// AI routes (direct AI interactions)

import { prisma } from '../index.js';
import aiClient from '../ai/client.js';
import { buildDraftResponsePrompt } from '../ai/prompts/draftResponse.js';
import { buildAnalyzeMessagePrompt } from '../ai/prompts/analyzeMessage.js';

export default async function aiRoutes(fastify) {
  // Generate response drafts for a thread
  fastify.post('/draft-response', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { threadId } = request.body;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        client: true,
        project: true,
        messages: { orderBy: { receivedAt: 'desc' }, take: 5 }
      }
    });

    if (!thread || !thread.messages[0]) {
      return reply.status(404).send({ error: 'Thread or messages not found' });
    }

    // Get analysis if available
    const analysis = thread.aiAnalysis
      ? JSON.parse(thread.aiAnalysis)
      : {
          intent: 'general',
          urgency: thread.priority,
          sentiment: 'neutral',
          summary: thread.messages[0].bodyText.substring(0, 200),
          questionsToAnswer: [],
          responseApproach: { keyPointsToAddress: [] }
        };

    const { system, prompt, temperature } = buildDraftResponsePrompt({
      message: thread.messages[0],
      thread,
      project: thread.project,
      analysis,
      client: thread.client
    });

    try {
      const result = await aiClient.chatJSON({ system, prompt, temperature });

      // Save the drafts as a response record
      const response = await prisma.response.create({
        data: {
          subject: result.options[0].subject,
          body: result.options[0].body,
          tone: result.options[0].tone,
          aiGenerated: true,
          aiOptions: JSON.stringify(result),
          status: 'DRAFT',
          threadId,
          draftedById: request.user.id
        }
      });

      return {
        responseId: response.id,
        recommendedOption: result.recommendedOption,
        recommendationReason: result.recommendationReason,
        options: result.options,
        warnings: result.warnings,
        needsPersonalTouch: result.needsPersonalTouch,
        personalTouchReason: result.personalTouchReason
      };
    } catch (error) {
      fastify.log.error('AI draft error:', error);
      return reply.status(500).send({
        error: 'Failed to generate response',
        message: error.message
      });
    }
  });

  // Refine an existing response with AI
  fastify.post('/refine-response', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { responseId, instruction } = request.body;

    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        thread: {
          include: {
            messages: { orderBy: { receivedAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    if (!response) {
      return reply.status(404).send({ error: 'Response not found' });
    }

    const system = `You are an AI assistant helping refine email responses.
Your task is to modify the given response according to the instruction while maintaining professionalism and addressing the original message.`;

    const prompt = `Original client message:
${response.thread.messages[0]?.bodyText || 'No message content'}

Current response draft:
Subject: ${response.subject}
Body: ${response.body}

Instruction: ${instruction}

Respond with JSON:
{
  "subject": "updated subject line",
  "body": "updated email body",
  "changes": ["list of changes made"]
}`;

    try {
      const result = await aiClient.chatJSON({
        system,
        prompt,
        temperature: 0.5
      });

      // Update the response
      await prisma.response.update({
        where: { id: responseId },
        data: {
          subject: result.subject,
          body: result.body
        }
      });

      return {
        subject: result.subject,
        body: result.body,
        changes: result.changes
      };
    } catch (error) {
      fastify.log.error('AI refine error:', error);
      return reply.status(500).send({
        error: 'Failed to refine response',
        message: error.message
      });
    }
  });

  // Ask AI a question about a thread/project
  fastify.post('/ask', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { question, threadId, projectId, clientId } = request.body;

    let context = '';

    // Gather relevant context
    if (threadId) {
      const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          messages: { orderBy: { receivedAt: 'asc' } },
          client: true,
          project: true
        }
      });
      if (thread) {
        context += `Thread: ${thread.subject}\n`;
        context += `Client: ${thread.client?.name || 'Unknown'}\n`;
        context += `Project: ${thread.project?.name || 'None'}\n\n`;
        context += 'Messages:\n';
        thread.messages.forEach(m => {
          context += `[${m.direction}] ${m.senderEmail}: ${m.bodyText}\n\n`;
        });
      }
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { client: true }
      });
      if (project) {
        context += `Project: ${project.name}\n`;
        context += `Client: ${project.client?.name || 'Unknown'}\n`;
        context += `Status: ${project.status}\n`;
        context += `Summary: ${project.aiSummary || 'No summary'}\n`;
      }
    }

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          projects: true,
          threads: {
            orderBy: { lastActivityAt: 'desc' },
            take: 5
          }
        }
      });
      if (client) {
        context += `Client: ${client.name}\n`;
        context += `Projects: ${client.projects.map(p => p.name).join(', ')}\n`;
        context += `Recent threads: ${client.threads.map(t => t.subject).join(', ')}\n`;
      }
    }

    const system = `You are an AI assistant for Agency Hub, helping answer questions about clients, projects, and communications.
Base your answers only on the provided context. If the context doesn't contain enough information, say so.`;

    const prompt = `Context:
${context || 'No specific context provided.'}

Question: ${question}

Provide a helpful, concise answer.`;

    try {
      const answer = await aiClient.chat({
        system,
        prompt,
        temperature: 0.4
      });

      return { question, answer, context: context ? 'Context provided' : 'No context' };
    } catch (error) {
      fastify.log.error('AI ask error:', error);
      return reply.status(500).send({
        error: 'Failed to get answer',
        message: error.message
      });
    }
  });

  // Generate project summary
  fastify.post('/summarize-project', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { projectId } = request.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        threads: {
          orderBy: { lastActivityAt: 'desc' },
          take: 10,
          include: {
            messages: { orderBy: { receivedAt: 'desc' }, take: 1 }
          }
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } }
        }
      }
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const system = `You are an AI assistant generating project status summaries for an agency.
Be concise but informative. Focus on current state, blockers, and next steps.`;

    const prompt = `Generate a status summary for this project:

Project: ${project.name}
Client: ${project.client?.name || 'Unknown'}
Status: ${project.status}

Recent threads:
${project.threads.map(t => `- ${t.subject} (${t.status}, ${t.priority})`).join('\n')}

Open tasks:
${project.tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}

Provide a 2-3 sentence summary of the project's current state.`;

    try {
      const summary = await aiClient.chat({
        system,
        prompt,
        temperature: 0.3
      });

      // Update the project summary
      await prisma.project.update({
        where: { id: projectId },
        data: { aiSummary: summary }
      });

      return { projectId, summary };
    } catch (error) {
      fastify.log.error('AI summarize error:', error);
      return reply.status(500).send({
        error: 'Failed to generate summary',
        message: error.message
      });
    }
  });
}
