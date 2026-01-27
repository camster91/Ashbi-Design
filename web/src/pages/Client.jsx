import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building,
  Mail,
  FolderOpen,
  MessageSquare,
  User,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatRelativeTime, getHealthColor, cn } from '../lib/utils';

export default function Client() {
  const { id } = useParams();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.getClient(id),
  });

  const { data: insights } = useQuery({
    queryKey: ['client-insights', id],
    queryFn: () => api.getClientInsights(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-8">Client not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/clients" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          {client.domain && (
            <p className="text-gray-500">{client.domain}</p>
          )}
        </div>
        <span
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg',
            client.status === 'ACTIVE'
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {client.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="font-semibold">Projects</h2>
              <span className="text-sm text-gray-500">
                {client.projects?.length || 0} total
              </span>
            </div>
            {client.projects?.length > 0 ? (
              <ul className="divide-y">
                {client.projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      to={`/project/${project.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-gray-500">
                            {project._count?.threads || 0} threads,{' '}
                            {project._count?.tasks || 0} tasks
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded',
                          getHealthColor(project.health)
                        )}
                      >
                        {project.health?.replace(/_/g, ' ')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No projects yet
              </div>
            )}
          </div>

          {/* Recent Threads */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">Recent Threads</h2>
            </div>
            {client.threads?.length > 0 ? (
              <ul className="divide-y">
                {client.threads.map((thread) => (
                  <li key={thread.id}>
                    <Link
                      to={`/thread/${thread.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{thread.subject}</div>
                          <div className="text-sm text-gray-500">
                            {thread.project?.name || 'No project'} -{' '}
                            {thread.assignedTo?.name || 'Unassigned'}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(thread.lastActivityAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No threads yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contacts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Contacts</h3>
            </div>
            {client.contacts?.length > 0 ? (
              <ul className="divide-y">
                {client.contacts.map((contact) => (
                  <li key={contact.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {contact.name}
                          {contact.isPrimary && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contact.role || contact.email}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No contacts
              </div>
            )}
          </div>

          {/* Insights */}
          {insights && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold">Insights</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Recent Threads</span>
                  <p className="font-medium">{insights.recentThreadCount}</p>
                </div>
                {insights.sentimentBreakdown &&
                  Object.keys(insights.sentimentBreakdown).length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Sentiment Breakdown
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(insights.sentimentBreakdown).map(
                          ([sentiment, count]) => (
                            <span
                              key={sentiment}
                              className="text-xs bg-gray-100 px-2 py-1 rounded"
                            >
                              {sentiment}: {count}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                <div>
                  <span className="text-sm text-gray-500">Satisfaction</span>
                  <p className="font-medium capitalize">
                    {insights.satisfactionTrend}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Communication Preferences */}
          {client.communicationPrefs &&
            Object.keys(client.communicationPrefs).length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">Communication Preferences</h3>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {Object.entries(client.communicationPrefs).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
