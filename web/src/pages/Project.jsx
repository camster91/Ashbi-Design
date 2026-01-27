import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  formatRelativeTime,
  getHealthColor,
  getPriorityColor,
  cn,
} from '../lib/utils';

export default function Project() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id),
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshProjectPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>;
  }

  const plan = project.aiPlan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.client?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg',
              getHealthColor(project.health)
            )}
          >
            {project.health?.replace(/_/g, ' ')} ({project.healthScore})
          </span>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <RefreshCw
              className={cn('w-4 h-4', refreshMutation.isPending && 'animate-spin')}
            />
            Refresh Plan
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {project.aiSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            AI Summary
          </h3>
          <p className="text-gray-700">{project.aiSummary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Plan */}
        <div className="lg:col-span-2 space-y-4">
          {/* Immediate */}
          <TaskCategory
            title="Immediate"
            icon={AlertTriangle}
            tasks={project.tasks?.filter((t) => t.category === 'IMMEDIATE')}
            color="red"
          />

          {/* This Week */}
          <TaskCategory
            title="This Week"
            icon={Clock}
            tasks={project.tasks?.filter((t) => t.category === 'THIS_WEEK')}
            color="orange"
          />

          {/* Upcoming */}
          <TaskCategory
            title="Upcoming"
            icon={Clock}
            tasks={project.tasks?.filter((t) => t.category === 'UPCOMING')}
            color="blue"
          />

          {/* Waiting */}
          <TaskCategory
            title="Waiting on Client"
            icon={Clock}
            tasks={project.tasks?.filter((t) => t.category === 'WAITING_CLIENT')}
            color="gray"
          />

          {/* Completed */}
          <TaskCategory
            title="Completed"
            icon={CheckCircle}
            tasks={project.tasks?.filter((t) => t.status === 'COMPLETED')}
            color="green"
            collapsed
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Active Threads */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold">Active Threads</h3>
              <span className="text-sm text-gray-500">
                {project.threads?.filter((t) => t.status !== 'RESOLVED').length || 0}
              </span>
            </div>
            <ul className="divide-y">
              {project.threads
                ?.filter((t) => t.status !== 'RESOLVED')
                .slice(0, 5)
                .map((thread) => (
                  <li key={thread.id}>
                    <Link
                      to={`/thread/${thread.id}`}
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium truncate">
                          {thread.subject}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded',
                            getPriorityColor(thread.priority)
                          )}
                        >
                          {thread.priority}
                        </span>
                        <span>{formatRelativeTime(thread.lastActivityAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
            {(!project.threads || project.threads.length === 0) && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No active threads
              </div>
            )}
          </div>

          {/* Risks */}
          {project.risks?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-red-600">Risks</h3>
              </div>
              <ul className="divide-y">
                {project.risks.map((risk, i) => (
                  <li key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">{risk.risk}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {risk.mitigation}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        Likelihood: {risk.likelihood}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        Impact: {risk.impact}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCategory({ title, icon: Icon, tasks = [], color, collapsed = false }) {
  const colors = {
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    gray: 'text-gray-600 bg-gray-50',
  };

  if (tasks.length === 0 && collapsed) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Icon className={cn('w-4 h-4', colors[color]?.split(' ')[0])} />
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-gray-500">({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No tasks in this category
        </div>
      ) : (
        <ul className="divide-y">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
            >
              <input
                type="checkbox"
                checked={task.status === 'COMPLETED'}
                onChange={() => {}}
                className="rounded border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'text-sm',
                    task.status === 'COMPLETED' && 'line-through text-gray-400'
                  )}
                >
                  {task.title}
                </span>
                {task.assignee && (
                  <span className="text-xs text-gray-500 ml-2">
                    @{task.assignee.name}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  getPriorityColor(task.priority)
                )}
              >
                {task.priority}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
