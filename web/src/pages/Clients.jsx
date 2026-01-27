import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building, FolderOpen, MessageSquare, Users, ChevronRight, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import CreateClientModal from '../components/CreateClientModal';

export default function Clients() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <CreateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Projects</th>
              <th className="px-4 py-3 font-medium">Threads</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients?.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium">
                      {client.name[0]}
                    </div>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">
                        {client._count?.contacts || 0} contacts
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {client.domain || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    {client._count?.projects || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    {client._count?.threads || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded',
                      client.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/client/${client.id}`}
                    className="text-primary hover:text-primary/80"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clients?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No clients yet. Add your first client to get started.
        </div>
      )}
    </div>
  );
}
