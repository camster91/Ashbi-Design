// BullMQ Workers

import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection, QUEUES, scheduleEscalationCheck } from './queue.js';
import { processEmailPipeline } from '../services/pipeline.service.js';
import { updateAllProjectHealth } from '../services/project.service.js';
import env from '../config/env.js';

const prisma = new PrismaClient();

// Email Processing Worker
const emailWorker = new Worker(
  QUEUES.EMAIL_PROCESSING,
  async (job) => {
    console.log(`Processing email job ${job.id}`);
    const result = await processEmailPipeline(job.data);

    // Schedule escalation if thread was created
    if (result.threadId) {
      const priority = result.analysis?.urgency || 'NORMAL';
      const delayHours = env.slaDefaults[priority] || 24;
      await scheduleEscalationCheck(result.threadId, delayHours * 3600000);
    }

    return result;
  },
  { connection, concurrency: 5 }
);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

// Project Health Worker
const healthWorker = new Worker(
  QUEUES.PROJECT_HEALTH,
  async (job) => {
    if (job.name === 'update-all-health') {
      console.log('Updating all project health scores');
      const count = await updateAllProjectHealth();
      return { updated: count };
    }

    if (job.name === 'update-health' && job.data.projectId) {
      const { calculateHealthScore, getHealthStatus } = await import('../services/project.service.js');

      const project = await prisma.project.findUnique({
        where: { id: job.data.projectId },
        include: { threads: { where: { status: { not: 'RESOLVED' } } } }
      });

      if (project) {
        const score = calculateHealthScore(project, project.threads);
        const health = getHealthStatus(score);

        await prisma.project.update({
          where: { id: job.data.projectId },
          data: { healthScore: score, health }
        });

        return { projectId: job.data.projectId, score, health };
      }
    }

    return { skipped: true };
  },
  { connection, concurrency: 2 }
);

healthWorker.on('failed', (job, err) => {
  console.error(`Health job ${job?.id} failed:`, err.message);
});

// Escalation Worker
const escalationWorker = new Worker(
  QUEUES.ESCALATION,
  async (job) => {
    if (job.name === 'check-all-escalations') {
      console.log('Checking all threads for escalation');
      return await checkAllEscalations();
    }

    if (job.name === 'check-escalation' && job.data.threadId) {
      return await checkThreadEscalation(job.data.threadId);
    }

    return { skipped: true };
  },
  { connection, concurrency: 2 }
);

escalationWorker.on('failed', (job, err) => {
  console.error(`Escalation job ${job?.id} failed:`, err.message);
});

// Notification Worker
const notificationWorker = new Worker(
  QUEUES.NOTIFICATIONS,
  async (job) => {
    const { userId, type, title, message, data } = job.data;

    // Create in-app notification
    await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        userId
      }
    });

    // TODO: Add email notification support
    // TODO: Add webhook/Slack notification support

    return { delivered: true };
  },
  { connection, concurrency: 10 }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});

/**
 * Check all threads for escalation needs
 */
async function checkAllEscalations() {
  const now = new Date();

  // Find threads needing response that are past SLA
  const threads = await prisma.thread.findMany({
    where: {
      status: 'AWAITING_RESPONSE',
      slaBreached: false
    },
    include: {
      assignedTo: true
    }
  });

  let escalated = 0;

  for (const thread of threads) {
    const result = await checkThreadEscalation(thread.id, thread);
    if (result.escalated) escalated++;
  }

  return { checked: threads.length, escalated };
}

/**
 * Check single thread for escalation
 */
async function checkThreadEscalation(threadId, existingThread = null) {
  const thread = existingThread || await prisma.thread.findUnique({
    where: { id: threadId },
    include: { assignedTo: true }
  });

  if (!thread || thread.status === 'RESOLVED') {
    return { skipped: true, reason: 'Thread not found or resolved' };
  }

  const now = new Date();
  const hoursSinceActivity = (now - new Date(thread.lastActivityAt)) / (1000 * 60 * 60);
  const slaHours = env.slaDefaults[thread.priority] || 24;

  // Check escalation thresholds
  // 4 hours: Notify assignee
  // 8 hours: Notify admin
  // 24 hours or SLA breach: Critical alert

  const notifications = [];

  if (hoursSinceActivity >= 4 && hoursSinceActivity < 8 && thread.assignedToId) {
    notifications.push({
      userId: thread.assignedToId,
      type: 'SLA_WARNING',
      title: 'Response needed soon',
      message: `Thread "${thread.subject}" needs attention (${Math.round(hoursSinceActivity)}h without response)`,
      data: { threadId }
    });
  }

  if (hoursSinceActivity >= 8) {
    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true }
    });

    for (const admin of admins) {
      notifications.push({
        userId: admin.id,
        type: 'ESCALATION',
        title: 'Thread escalation',
        message: `Thread "${thread.subject}" has had no response for ${Math.round(hoursSinceActivity)} hours`,
        data: { threadId, assigneeId: thread.assignedToId }
      });
    }
  }

  if (hoursSinceActivity >= slaHours && !thread.slaBreached) {
    // Mark SLA as breached
    await prisma.thread.update({
      where: { id: threadId },
      data: { slaBreached: true }
    });

    // Critical notification
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true }
    });

    for (const admin of admins) {
      notifications.push({
        userId: admin.id,
        type: 'SLA_BREACH',
        title: 'SLA BREACH',
        message: `Thread "${thread.subject}" has breached SLA (${Math.round(hoursSinceActivity)}h without response)`,
        data: { threadId, priority: thread.priority }
      });
    }
  }

  // Create notifications
  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  return {
    escalated: notifications.length > 0,
    notifications: notifications.length,
    hoursSinceActivity: Math.round(hoursSinceActivity)
  };
}

console.log('Workers started');
console.log('- Email processing worker');
console.log('- Project health worker');
console.log('- Escalation worker');
console.log('- Notification worker');
