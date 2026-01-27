// BullMQ Queue Setup

import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';

// Create Redis connection
const connection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null
});

// Queue names
export const QUEUES = {
  EMAIL_PROCESSING: 'email-processing',
  PROJECT_HEALTH: 'project-health',
  ESCALATION: 'escalation',
  NOTIFICATIONS: 'notifications'
};

// Create queues
export const emailQueue = new Queue(QUEUES.EMAIL_PROCESSING, { connection });
export const healthQueue = new Queue(QUEUES.PROJECT_HEALTH, { connection });
export const escalationQueue = new Queue(QUEUES.ESCALATION, { connection });
export const notificationQueue = new Queue(QUEUES.NOTIFICATIONS, { connection });

// Queue event handlers
const emailQueueEvents = new QueueEvents(QUEUES.EMAIL_PROCESSING, { connection });
emailQueueEvents.on('completed', ({ jobId }) => {
  console.log(`Email processing job ${jobId} completed`);
});
emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Email processing job ${jobId} failed: ${failedReason}`);
});

/**
 * Add email to processing queue
 */
export async function queueEmailForProcessing(emailData) {
  const job = await emailQueue.add('process-email', emailData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
  return job.id;
}

/**
 * Schedule project health update
 */
export async function scheduleHealthUpdate(projectId) {
  await healthQueue.add('update-health', { projectId }, {
    delay: 60000, // 1 minute delay to batch updates
    jobId: `health-${projectId}`, // Prevent duplicate jobs
    removeOnComplete: true
  });
}

/**
 * Schedule escalation check
 */
export async function scheduleEscalationCheck(threadId, delayMs) {
  await escalationQueue.add('check-escalation', { threadId }, {
    delay: delayMs,
    jobId: `escalation-${threadId}`,
    removeOnComplete: true
  });
}

/**
 * Queue notification for delivery
 */
export async function queueNotification(notification) {
  await notificationQueue.add('send-notification', notification, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });
}

/**
 * Set up recurring jobs
 */
export async function setupRecurringJobs() {
  // Health check every hour
  await healthQueue.add('update-all-health', {}, {
    repeat: { every: 3600000 }, // 1 hour
    jobId: 'recurring-health-check'
  });

  // Escalation check every 15 minutes
  await escalationQueue.add('check-all-escalations', {}, {
    repeat: { every: 900000 }, // 15 minutes
    jobId: 'recurring-escalation-check'
  });

  console.log('Recurring jobs scheduled');
}

export { connection };
