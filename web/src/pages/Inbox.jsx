import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  User,
  FolderOpen,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  formatRelativeTime,
  truncate,
  getPriorityColor,
  getStatusColor,
  getSentimentIcon,
} from '../lib/utils';
import { cn } from '../lib/utils';

export default function Inbox() {
  const { data: inboxData, isLoading } = useQuery({
    queryKey: ['inbox'],
    queryFn: () => api.getInbox(),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['inbox-stats'],
    queryFn: api.getInboxStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const threads = inboxData?.threads || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Open Threads"
          value={stats?.total || 0}
          icon={AlertCircle}
        />
        <StatCard
          label="Needs Response"
          value={stats?.needsResponse || 0}
          icon={Clock}
          highlight
        />
        <StatCard
          label="Critical"
          value={stats?.critical || 0}
          icon={AlertCircle}
          urgent={stats?.critical > 0}
        />
        <StatCard
          label="Pending Approval"
          value={stats?.pendingApproval || 0}
          icon={User}
        />
      </div>

      {/* Thread List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">Inbox</h2>
        </div>

        {threads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No threads to show. All caught up!
          </div>
        ) : (
          <ul className="divide-y">
            {threads.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight, urgent }) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg',
        urgent
          ? 'bg-red-50 border border-red-200'
          : highlight
          ? 'bg-orange-50 border border-orange-200'
          : 'bg-white border border-gray-200'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p
            className={cn(
              'text-2xl font-bold',
              urgent ? 'text-red-600' : highlight ? 'text-orange-600' : ''
            )}
          >
            {value}
          </p>
        </div>
        <Icon
          className={cn(
            'w-8 h-8',
            urgent
              ? 'text-red-400'
              : highlight
              ? 'text-orange-400'
              : 'text-gray-400'
          )}
        />
      </div>
    </div>
  );
}

function ThreadRow({ thread }) {
  const latestMessage = thread.messages?.[0];

  return (
    <li>
      <Link
        to={`/thread/${thread.id}`}
        className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        {/* Priority indicator */}
        <div
          className={cn(
            'w-1 h-12 rounded-full mr-3',
            thread.priority === 'CRITICAL'
              ? 'bg-red-500'
              : thread.priority === 'HIGH'
              ? 'bg-orange-500'
              : 'bg-blue-500'
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {thread.subject}
            </span>
            {thread.sentiment && (
              <span title={thread.sentiment}>
                {getSentimentIcon(thread.sentiment)}
              </span>
            )}
            {thread.needsTriage && (
              <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                Needs Triage
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            {thread.client && (
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {thread.client.name}
              </span>
            )}
            {thread.project && (
              <span className="flex items-center">
                <FolderOpen className="w-3 h-3 mr-1" />
                {thread.project.name}
              </span>
            )}
            {latestMessage && (
              <span className="truncate">
                {truncate(latestMessage.bodyText, 50)}
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 ml-4">
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded',
              getStatusColor(thread.status)
            )}
          >
            {thread.status.replace(/_/g, ' ')}
          </span>
          <span className="text-sm text-gray-500">
            {formatRelativeTime(thread.lastActivityAt)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </Link>
    </li>
  );
}
