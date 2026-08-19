/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Project, ProjectStatus, User } from '../../types';
import { ProjectEditModal } from './ProjectEditModal';
import { 
  FolderKanban, PlusCircle, Search, Edit3, Trash2, Calendar, Users, Github, RefreshCw 
} from 'lucide-react';
import { scaleIn, fadeInUp } from '../../utils/motion';

interface TechLeadProjectsProps {
  currentUser: User;
}

export const TechLeadProjects: React.FC<TechLeadProjectsProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  
  // Modal States
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: projects = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["projects", "techlead-view"],
    queryFn: () => api.getProjects(),
  });

  const { data: techLeads = [] } = useQuery({
    queryKey: ["public-tech-leads"],
    queryFn: () => api.getPublicTechLeads(),
  });

  const { data: interns = [] } = useQuery({
    queryKey: ["public-interns"],
    queryFn: () => api.getPublicInterns(),
  });

  const handleCreateOrEditProject = async (data: {
    id: string;
    name: string;
    description: string;
    github_url: string;
    tech_stack: string[];
    screenshots: string[];
    status: ProjectStatus;
    start_date?: string;
    end_date?: string;
    assigned_tech_lead_ids: string[];
    assigned_intern_ids: string[];
  }) => {
    try {
      setIsSubmitting(true);
      
      const payload: Partial<Project> = {
        name: data.name,
        description: data.description,
        github_url: data.github_url,
        tech_stack: data.tech_stack,
        screenshots: data.screenshots,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        assigned_tech_lead_ids: data.assigned_tech_lead_ids,
        assigned_intern_ids: data.assigned_intern_ids,
        owner_id: currentUser.id,
      };

      if (data.id) {
        payload.id = data.id;
      }

      await api.saveProject(payload);
      
      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "techlead-view"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", currentUser.id] });
      
      setEditingProject(null);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to save project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete the project "${projectName}"? This will permanently delete all logs and data associated with it.`)) {
      return;
    }

    try {
      await api.deleteProject(projectId);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "techlead-view"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", currentUser.id] });
    } catch (err: any) {
      alert(err.message || "Failed to delete project.");
    }
  };

  const filteredProjects = projects.filter(p => {
    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchStack = p.tech_stack.some(t => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchStack;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/30 p-6 md:p-8 shadow-lg shadow-teal-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Projects Registry & Sprint Manager
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Manage sprint deliverables, create new engineering projects, assign interns and tech leads, and monitor ongoing workloads.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create Project
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Projects List"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-4 shadow-lg shadow-teal-500/5 gap-3 flex flex-col sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name, description, or stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-slate-950/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:w-48 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">📁 All Project Statuses</option>
            <option value="ACTIVE">⚡ Active / Ongoing</option>
            <option value="UPCOMING">📅 Upcoming</option>
            <option value="PLANNED">📝 Planned</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="ARCHIVED">📦 Archived</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-xs text-slate-400">Loading project cards...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center space-y-3">
          <FolderKanban className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No projects found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or create a new project to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const leads = techLeads.filter(l => proj.assigned_tech_lead_ids?.includes(l.id));
            const assignedInts = interns.filter(i => proj.assigned_intern_ids?.includes(i.id));

            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-teal-500/5 transition duration-250 flex flex-col justify-between group"
              >
                {/* Screenshot / Cover */}
                <div className="h-44 bg-slate-950 relative overflow-hidden shrink-0">
                  <img
                    src={proj.screenshots[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Status Badge */}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                    proj.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    proj.status === 'upcoming' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    proj.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white text-sm leading-tight truncate">{proj.name}</h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{proj.description}</p>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Tech Stack */}
                    {proj.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.tech_stack.map(tech => (
                          <span key={tech} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-semibold text-teal-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-col gap-1 text-[10px] text-slate-400">
                      {proj.start_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" /> 
                          Starts: {new Date(proj.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {leads.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          Leads: {leads.map(l => l.name).join(', ')}
                        </span>
                      )}
                      {assignedInts.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          Interns: {assignedInts.map(i => i.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    {proj.github_url ? (
                      <a
                        href={proj.github_url.startsWith('http') ? proj.github_url : `https://${proj.github_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-300 hover:text-teal-300 flex items-center gap-1.5 transition"
                      >
                        <Github className="h-4 w-4" /> Codebase
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No repo url</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingProject(proj)}
                        className="px-2.5 py-1.5 hover:bg-white/5 text-[10px] font-bold text-teal-300 rounded-lg flex items-center gap-1 cursor-pointer"
                        title="Edit Project"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        className="px-2.5 py-1.5 hover:bg-rose-500/10 text-[10px] font-bold text-rose-300 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Project Modal */}
      <ProjectEditModal
        show={showCreateModal || !!editingProject}
        onClose={() => {
          setEditingProject(null);
          setShowCreateModal(false);
        }}
        project={editingProject}
        techLeads={techLeads}
        interns={interns}
        onSubmit={handleCreateOrEditProject}
        submitting={isSubmitting}
      />
    </div>
  );
};
