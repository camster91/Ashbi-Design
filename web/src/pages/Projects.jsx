import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderOpen, Users, MessageSquare, ChevronRight, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { getHealthColor, cn } from '../lib/utils';
import CreateProjectModal from '../components/CreateProjectModal';

export default function Projects() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
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
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-500">{project.client?.name}</p>
              </div>
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded',
                  getHealthColor(project.health)
                )}
              >
                {project.health?.replace(/_/g, ' ')}
              </span>
            </div>

            {project.aiSummary && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {project.aiSummary}
              </p>
            )}

            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                {project._count?.threads || 0} threads
              </span>
              <span className="flex items-center">
                <FolderOpen className="w-4 h-4 mr-1" />
                {project._count?.tasks || 0} tasks
              </span>
            </div>

            <div className="flex items-center justify-end mt-3 text-primary">
              <span className="text-sm">View project</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {projects?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No projects yet. Create your first project to get started.
        </div>
      )}
    </div>
  );
}
