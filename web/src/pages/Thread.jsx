import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft,
  User,
  FolderOpen,
  Send,
  Sparkles,
  Clock,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  formatDateTime,
  getPriorityColor,
  getStatusColor,
  getSentimentIcon,
  cn,
} from '../lib/utils';

export default function Thread() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [responseText, setResponseText] = useState('');
  const [noteText, setNoteText] = useState('');

  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.getThread(id),
  });

  const draftMutation = useMutation({
    mutationFn: () => api.draftResponse(id),
    onSuccess: (data) => {
      setResponseText(data.options[0]?.body || '');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (body) => api.createResponse(id, { subject: `Re: ${thread.subject}`, body, tone: 'professional' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['thread', id]);
      setResponseText('');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (content) => api.addNote(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['thread', id]);
      setNoteText('');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => api.resolveThread(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['thread', id]);
      queryClient.invalidateQueries(['inbox']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!thread) {
    return <div className="text-center py-8">Thread not found</div>;
  }

  const analysis = thread.aiAnalysis;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/inbox"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{thread.subject}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {thread.client && (
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {thread.client.name}
              </span>
            )}
            {thread.project && (
              <Link
                to={`/project/${thread.project.id}`}
                className="flex items-center hover:text-primary"
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                {thread.project.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-1 text-sm font-medium rounded',
              getPriorityColor(thread.priority)
            )}
          >
            {thread.priority}
          </span>
          <span
            className={cn(
              'px-2 py-1 text-sm font-medium rounded',
              getStatusColor(thread.status)
            )}
          >
            {thread.status.replace(/_/g, ' ')}
          </span>
          {thread.status !== 'RESOLVED' && (
            <button
              onClick={() => resolveMutation.mutate()}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Resolve
            </button>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            AI Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Intent:</span>
              <span className="ml-2 font-medium">{analysis.intent}</span>
            </div>
            <div>
              <span className="text-gray-500">Sentiment:</span>
              <span className="ml-2">
                {getSentimentIcon(analysis.sentiment)} {analysis.sentiment}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Urgency:</span>
              <span className="ml-2 font-medium">{analysis.urgency}</span>
            </div>
            {analysis.questionsToAnswer?.length > 0 && (
              <div>
                <span className="text-gray-500">Questions:</span>
                <span className="ml-2">{analysis.questionsToAnswer.length}</span>
              </div>
            )}
          </div>
          {analysis.summary && (
            <p className="mt-2 text-sm text-gray-700">{analysis.summary}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">Conversation</h2>
            </div>
            <div className="divide-y">
              {thread.messages?.map((message) => (
                <div key={message.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        message.direction === 'INBOUND'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-primary text-white'
                      )}
                    >
                      {message.senderName?.[0] || 'U'}
                    </div>
                    <div>
                      <span className="font-medium">
                        {message.senderName || message.senderEmail}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {formatDateTime(message.receivedAt)}
                      </span>
                    </div>
                    {message.direction === 'INBOUND' && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        Client
                      </span>
                    )}
                  </div>
                  <div className="pl-10 whitespace-pre-wrap text-gray-700">
                    {message.bodyText}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          {thread.internalNotes?.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Internal Notes
                </h2>
              </div>
              <div className="divide-y">
                {thread.internalNotes.map((note) => (
                  <div key={note.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {note.author.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Composer */}
          {thread.status !== 'RESOLVED' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b flex justify-between items-center">
                <h2 className="font-semibold">Compose Response</h2>
                <button
                  onClick={() => draftMutation.mutate()}
                  disabled={draftMutation.isPending}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {draftMutation.isPending ? 'Generating...' : 'AI Draft'}
                </button>
              </div>
              <div className="p-4">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Write your response..."
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => submitMutation.mutate(responseText)}
                    disabled={!responseText || submitMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitMutation.isPending ? 'Saving...' : 'Save Draft'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Note */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">Add Internal Note</h2>
            </div>
            <div className="p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Add a note for the team..."
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => noteMutation.mutate(noteText)}
                  disabled={!noteText || noteMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Thread Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Assigned to</dt>
                <dd>{thread.assignedTo?.name || 'Unassigned'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd>{formatDateTime(thread.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Activity</dt>
                <dd>{formatDateTime(thread.lastActivityAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Messages</dt>
                <dd>{thread.messages?.length || 0}</dd>
              </div>
            </dl>
          </div>

          {/* Response Drafts */}
          {thread.responses?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium mb-3">Response Drafts</h3>
              <ul className="space-y-2">
                {thread.responses.map((response) => (
                  <li
                    key={response.id}
                    className="p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-xs rounded',
                          response.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : response.status === 'PENDING_APPROVAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {response.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {response.draftedBy?.name}
                      </span>
                    </div>
                    <p className="text-gray-600 truncate">{response.body}</p>
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
