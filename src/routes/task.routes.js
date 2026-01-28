// Task routes

import { prisma } from '../index.js';

export default async function taskRoutes(fastify) {
  // List all tasks with filters
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    const { status, priority, category, projectId, assigneeId, page: pageParam = '1', limit: limitParam = '50' } = request.query;

    const page = parseInt(pageParam);
    const limit = parseInt(limitParam);

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;

    // Team members see only their tasks
    if (request.user.role !== 'ADMIN') {
      where.assigneeId = request.user.id;
    } else if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, clientId: true } },
          assignee: { select: { id: true, name: true } }
        },
        orderBy: [
          { priority: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.task.count({ where })
    ]);

    return {
      tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  });

  // Get my tasks (current user)
  fastify.get('/my', {
    onRequest: [fastify.authenticate]
  }, async (request) => {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: request.user.id,
        status: { not: 'COMPLETED' }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' }
      ]
    });

    // Group by category
    const grouped = {
      IMMEDIATE: [],
      THIS_WEEK: [],
      UPCOMING: [],
      WAITING_CLIENT: [],
      WAITING_US: []
    };

    tasks.forEach(task => {
      if (grouped[task.category]) {
        grouped[task.category].push(task);
      } else {
        grouped.UPCOMING.push(task);
      }
    });

    return grouped;
  });

  // Get single task
  fastify.get('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true } }
          }
        },
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    return task;
  });

  // Update task
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const {
      title,
      description,
      status,
      priority,
      category,
      estimatedTime,
      dueDate,
      assigneeId,
      blockedBy
    } = request.body;

    const data = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (category) data.category = category;
    if (estimatedTime !== undefined) data.estimatedTime = estimatedTime;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;
    if (blockedBy !== undefined) data.blockedBy = blockedBy;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    return task;
  });

  // Complete task
  fastify.post('/:id/complete', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    return task;
  });

  // Delete task
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    // Only allow deletion by admin or assignee
    if (request.user.role !== 'ADMIN' && task.assigneeId !== request.user.id) {
      return reply.status(403).send({ error: 'Not authorized to delete this task' });
    }

    await prisma.task.delete({ where: { id } });

    return { success: true };
  });

  // Bulk update task categories (for drag-drop reordering)
  fastify.post('/bulk-update', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { updates } = request.body;

    // updates is an array of { id, category, priority }
    const results = await Promise.all(
      updates.map(update =>
        prisma.task.update({
          where: { id: update.id },
          data: {
            category: update.category,
            priority: update.priority
          }
        })
      )
    );

    return { success: true, updated: results.length };
  });
}
