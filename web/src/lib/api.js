// API client for Agency Hub

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  me: () =>
    request('/auth/me'),

  // Inbox
  getInbox: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inbox${query ? `?${query}` : ''}`);
  },
  getInboxStats: () =>
    request('/inbox/stats'),
  getUnmatched: () =>
    request('/inbox/unmatched'),
  assignUnmatched: (id, data) =>
    request(`/inbox/unmatched/${id}/assign`, { method: 'POST', body: data }),
  ignoreUnmatched: (id) =>
    request(`/inbox/unmatched/${id}/ignore`, { method: 'POST' }),

  // Threads
  getThreads: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/threads${query ? `?${query}` : ''}`);
  },
  getThread: (id) =>
    request(`/threads/${id}`),
  updateThread: (id, data) =>
    request(`/threads/${id}`, { method: 'PUT', body: data }),
  assignThread: (id, data) =>
    request(`/threads/${id}/assign`, { method: 'POST', body: data }),
  snoozeThread: (id, until) =>
    request(`/threads/${id}/snooze`, { method: 'POST', body: { until } }),
  resolveThread: (id) =>
    request(`/threads/${id}/resolve`, { method: 'POST' }),
  analyzeThread: (id) =>
    request(`/threads/${id}/analyze`, { method: 'POST' }),
  addNote: (id, content) =>
    request(`/threads/${id}/notes`, { method: 'POST', body: { content } }),

  // Responses
  getPendingResponses: () =>
    request('/responses/pending'),
  createResponse: (threadId, data) =>
    request(`/responses/${threadId}/drafts`, { method: 'POST', body: data }),
  updateResponse: (id, data) =>
    request(`/responses/${id}`, { method: 'PUT', body: data }),
  submitResponse: (id) =>
    request(`/responses/${id}/submit`, { method: 'POST' }),
  approveResponse: (id) =>
    request(`/responses/${id}/approve`, { method: 'POST' }),
  rejectResponse: (id, reason) =>
    request(`/responses/${id}/reject`, { method: 'POST', body: { reason } }),

  // Clients
  getClients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/clients${query ? `?${query}` : ''}`);
  },
  getClient: (id) =>
    request(`/clients/${id}`),
  createClient: (data) =>
    request('/clients', { method: 'POST', body: data }),
  updateClient: (id, data) =>
    request(`/clients/${id}`, { method: 'PUT', body: data }),
  getClientInsights: (id) =>
    request(`/clients/${id}/insights`),

  // Projects
  getProjects: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/projects${query ? `?${query}` : ''}`);
  },
  getProject: (id) =>
    request(`/projects/${id}`),
  createProject: (data) =>
    request('/projects', { method: 'POST', body: data }),
  updateProject: (id, data) =>
    request(`/projects/${id}`, { method: 'PUT', body: data }),
  refreshProjectPlan: (id) =>
    request(`/projects/${id}/plan/refresh`, { method: 'POST' }),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks${query ? `?${query}` : ''}`);
  },
  getMyTasks: () =>
    request('/tasks/my'),
  updateTask: (id, data) =>
    request(`/tasks/${id}`, { method: 'PUT', body: data }),
  completeTask: (id) =>
    request(`/tasks/${id}/complete`, { method: 'POST' }),

  // Team
  getTeam: () =>
    request('/team'),
  getTeamMember: (id) =>
    request(`/team/${id}`),
  createTeamMember: (data) =>
    request('/team', { method: 'POST', body: data }),
  updateTeamMember: (id, data) =>
    request(`/team/${id}`, { method: 'PUT', body: data }),
  getWorkload: () =>
    request('/team/workload'),

  // Search
  search: (q, params = {}) => {
    const query = new URLSearchParams({ q, ...params }).toString();
    return request(`/search?${query}`);
  },

  // Analytics
  getOverview: (days = 30) =>
    request(`/analytics/overview?days=${days}`),
  getResponseTimes: (days = 30) =>
    request(`/analytics/response-times?days=${days}`),
  getTeamAnalytics: (days = 30) =>
    request(`/analytics/team?days=${days}`),

  // AI
  draftResponse: (threadId) =>
    request('/ai/draft-response', { method: 'POST', body: { threadId } }),
  refineResponse: (responseId, instruction) =>
    request('/ai/refine-response', { method: 'POST', body: { responseId, instruction } }),
  askAI: (question, context = {}) =>
    request('/ai/ask', { method: 'POST', body: { question, ...context } }),

  // Notifications
  getNotifications: () =>
    request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/read/${id}`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'POST' }),

  // Settings - Assignment Rules
  getAssignmentRules: () =>
    request('/settings/assignment-rules'),
  createAssignmentRule: (data) =>
    request('/settings/assignment-rules', { method: 'POST', body: data }),
  updateAssignmentRule: (id, data) =>
    request(`/settings/assignment-rules/${id}`, { method: 'PUT', body: data }),
  deleteAssignmentRule: (id) =>
    request(`/settings/assignment-rules/${id}`, { method: 'DELETE' }),

  // Settings - Templates
  getTemplates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/settings/templates${query ? `?${query}` : ''}`);
  },
  getTemplate: (id) =>
    request(`/settings/templates/${id}`),
  createTemplate: (data) =>
    request('/settings/templates', { method: 'POST', body: data }),
  updateTemplate: (id, data) =>
    request(`/settings/templates/${id}`, { method: 'PUT', body: data }),
  deleteTemplate: (id) =>
    request(`/settings/templates/${id}`, { method: 'DELETE' }),
  renderTemplate: (id, variables) =>
    request(`/settings/templates/${id}/render`, { method: 'POST', body: { variables } }),

  // ==================== NEW FEATURES ====================

  // Project Chat
  getChatMessages: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/chat/projects/${projectId}/messages${query ? `?${query}` : ''}`);
  },
  sendChatMessage: (projectId, data) =>
    request(`/chat/projects/${projectId}/messages`, { method: 'POST', body: data }),
  editChatMessage: (projectId, messageId, content) =>
    request(`/chat/projects/${projectId}/messages/${messageId}`, { method: 'PUT', body: { content } }),
  deleteChatMessage: (projectId, messageId) =>
    request(`/chat/projects/${projectId}/messages/${messageId}`, { method: 'DELETE' }),
  addChatReaction: (projectId, messageId, emoji) =>
    request(`/chat/projects/${projectId}/messages/${messageId}/reactions`, { method: 'POST', body: { emoji } }),
  removeChatReaction: (projectId, messageId, emoji) =>
    request(`/chat/projects/${projectId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, { method: 'DELETE' }),

  // Notes
  getNotes: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/projects/${projectId}/notes${query ? `?${query}` : ''}`);
  },
  getNote: (id) =>
    request(`/notes/${id}`),
  createNote: (projectId, data) =>
    request(`/projects/${projectId}/notes`, { method: 'POST', body: data }),
  updateNote: (id, data) =>
    request(`/notes/${id}`, { method: 'PUT', body: data }),
  deleteNote: (id) =>
    request(`/notes/${id}`, { method: 'DELETE' }),
  pinNote: (id) =>
    request(`/notes/${id}/pin`, { method: 'POST' }),

  // Milestones
  getMilestones: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/projects/${projectId}/milestones${query ? `?${query}` : ''}`);
  },
  getMilestone: (id) =>
    request(`/milestones/${id}`),
  createMilestone: (projectId, data) =>
    request(`/projects/${projectId}/milestones`, { method: 'POST', body: data }),
  updateMilestone: (id, data) =>
    request(`/milestones/${id}`, { method: 'PUT', body: data }),
  deleteMilestone: (id) =>
    request(`/milestones/${id}`, { method: 'DELETE' }),
  addTaskToMilestone: (milestoneId, taskId) =>
    request(`/milestones/${milestoneId}/tasks/${taskId}`, { method: 'POST' }),
  removeTaskFromMilestone: (milestoneId, taskId) =>
    request(`/milestones/${milestoneId}/tasks/${taskId}`, { method: 'DELETE' }),

  // Time Tracking
  getTimeEntries: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/projects/${projectId}/time-entries${query ? `?${query}` : ''}`);
  },
  getMyTimeEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/time-entries/my${query ? `?${query}` : ''}`);
  },
  createTimeEntry: (data) =>
    request('/time-entries', { method: 'POST', body: data }),
  updateTimeEntry: (id, data) =>
    request(`/time-entries/${id}`, { method: 'PUT', body: data }),
  deleteTimeEntry: (id) =>
    request(`/time-entries/${id}`, { method: 'DELETE' }),
  getTimeSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/time-entries/summary${query ? `?${query}` : ''}`);
  },

  // Activity Feed
  getProjectActivity: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/projects/${projectId}/activity${query ? `?${query}` : ''}`);
  },
  getActivity: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activity${query ? `?${query}` : ''}`);
  },
  getMyActivity: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activity/my${query ? `?${query}` : ''}`);
  },
  getActivitySummary: (days = 7) =>
    request(`/activity/summary?days=${days}`),

  // Task Comments
  getTaskComments: (taskId) =>
    request(`/tasks/${taskId}/comments`),
  addTaskComment: (taskId, content) =>
    request(`/tasks/${taskId}/comments`, { method: 'POST', body: { content } }),
  updateComment: (id, content) =>
    request(`/comments/${id}`, { method: 'PUT', body: { content } }),
  deleteComment: (id) =>
    request(`/comments/${id}`, { method: 'DELETE' }),
  getMentionableUsers: (query = '') =>
    request(`/users/mentionable${query ? `?query=${query}` : ''}`),

  // Calendar
  getCalendarEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/calendar${query ? `?${query}` : ''}`);
  },
  getMyCalendarEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/calendar/my${query ? `?${query}` : ''}`);
  },
  getCalendarEvent: (id) =>
    request(`/calendar/${id}`),
  createCalendarEvent: (data) =>
    request('/calendar', { method: 'POST', body: data }),
  updateCalendarEvent: (id, data) =>
    request(`/calendar/${id}`, { method: 'PUT', body: data }),
  deleteCalendarEvent: (id) =>
    request(`/calendar/${id}`, { method: 'DELETE' }),
  rsvpCalendarEvent: (id, status) =>
    request(`/calendar/${id}/rsvp`, { method: 'POST', body: { status } }),
  getUpcomingEvents: (limit = 5) =>
    request(`/calendar/upcoming?limit=${limit}`),

  // Attachments
  getAttachments: (entityType, entityId) =>
    request(`/attachments?entityType=${entityType}&entityId=${entityId}`),
  deleteAttachment: (id) =>
    request(`/attachments/${id}`, { method: 'DELETE' }),
  // Note: File upload uses FormData, handled separately in components

  // Kanban (using existing tasks endpoints)
  updateTaskPosition: (id, data) =>
    request(`/tasks/${id}`, { method: 'PUT', body: data }),
  bulkUpdateTasks: (updates) =>
    request('/tasks/bulk-update', { method: 'POST', body: { updates } }),
};

export default api;
