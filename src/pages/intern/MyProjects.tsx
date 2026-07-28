/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api.js';
import { User, Project } from '../../types.js';
import { Plus, Folder, Github, ExternalLink, Tag, Edit, Sparkles, X } from 'lucide-react';
import { scaleIn } from '../../utils/motion.js';

interface MyProjectsProps {
  currentUser: User;
  readOnly?: boolean;
}

export const MyProjects: React.FC<MyProjectsProps> = ({ currentUser, readOnly = false }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      const pList = await api.getProjects();
      // If it's readOnly (e.g. Manager), show all. If it's Intern, show their own or let them see all, but only edit theirs.
      setProjects(pList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !githubUrl.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setError('');
      const payload: Partial<Project> = {
        name: name.trim(),
        description: description.trim(),
        github_url: githubUrl.trim(),
        tech_stack: techStack.split(',').map(s => s.trim()).filter(Boolean),
        owner_id: currentUser.id,
        screenshots: screenshotUrl ? [screenshotUrl] : [
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
        ]
      };

      if (editingId) {
        payload.id = editingId;
      }

      await api.saveProject(payload);
      
      // Reset form
      setName('');
      setDescription('');
      setGithubUrl('');
      setTechStack('');
      setScreenshotUrl('');
      setEditingId(null);
      setShowForm(false);
      
      loadProjects();
    } catch (err: any) {
      setError(err.message || "Failed to save project.");
    }
  };

  const startEdit = (proj: Project) => {
    setEditingId(proj.id);
    setName(proj.name);
    setDescription(proj.description);
    setGithubUrl(proj.github_url);
    setTechStack(proj.tech_stack.join(', '));
    setScreenshotUrl(proj.screenshots[0] || '');
    setShowForm(true);
  };

  return (
    <div id="projects-gallery-root" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Projects Registry <Folder className="h-5 w-5 text-teal-600" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {readOnly ? 'Central registry of all active corporate project pipelines.' : 'Manage, describe, and link your codebases and live links.'}
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setDescription('');
              setGithubUrl('');
              setTechStack('');
              setScreenshotUrl('');
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Project Card
          </button>
        )}
      </div>

      {/* Edit/Add Form Inline */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                {editingId ? 'Modify Project details' : 'Define New Project Entry'} <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">{error}</p>}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Project Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. E-Commerce Checkout Revamp" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">GitHub Repo URL *</label>
                <input 
                  type="url" 
                  placeholder="https://github.com/org/repo" 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Short Description *</label>
                <textarea 
                  rows={2} 
                  placeholder="Optimizing checkout pipelines and adding spring-based confetti rewards to checkout cards..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tech Stack (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="React, TypeScript, Tailwind CSS, Motion" 
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Cover Screenshot URL (optional)</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {editingId ? 'Update Card' : 'Save Project Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-12 text-center space-y-3">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
            <Folder className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">No projects registered yet 📁</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {readOnly ? 'No active corporate project pipelines exist in this directory yet.' : 'Describe and link your first project card to get started and document your work!'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const isOwner = proj.owner_id === currentUser.id;
            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/5 flex flex-col hover:shadow-md transition duration-250 group relative"
              >
                {/* Screenshot cover */}
                <div className="h-44 bg-slate-100 dark:bg-slate-950 relative overflow-hidden shrink-0">
                  <img 
                    src={proj.screenshots[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"} 
                    alt={proj.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <a 
                      href={proj.github_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-white text-[11px] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Github className="h-4 w-4" /> View Repo codebase
                    </a>
                  </div>

                  {/* Owner Badge */}
                  {isOwner && (
                     <span className="absolute top-3 left-3 px-2.5 py-1 bg-teal-600 text-white rounded-full text-[9px] font-bold shadow-sm">
                      My Project
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight">{proj.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{proj.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {/* Tags */}
                    {proj.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.tech_stack.map(tech => (
                          <span key={tech} className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 text-[9px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-900">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <a 
                        href={proj.github_url} 
                        target="_blank" 
                        rel="noreferrer"
                         className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5"
                      >
                        <Github className="h-4 w-4" /> Repo
                      </a>

                      {!readOnly && isOwner && (
                        <button
                          onClick={() => startEdit(proj)}
                          className="px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-950 text-[10px] font-bold text-teal-600 dark:text-teal-400 rounded-lg flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit Card
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
