/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, Project } from '../../types';
import { Plus, Folder, Github, ExternalLink, Tag, Edit, Sparkles, X, User as UserIcon, Lock, Upload, Users } from 'lucide-react';
import { scaleIn } from '../../utils/motion';
import { uploadBase64Image } from '../../lib/supabase';

interface MyProjectsProps {
  currentUser: User;
  readOnly?: boolean;
}

export const MyProjects: React.FC<MyProjectsProps> = ({ currentUser, readOnly = false }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const isIntern = currentUser.role === 'intern';
  const canCreate = !isIntern && !readOnly;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [interns, setInterns] = useState<User[]>([]);
  const [assignedInternIds, setAssignedInternIds] = useState<string[]>([]);

  const loadProjects = async () => {
    try {
      const pList = await api.getProjects();
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

  useEffect(() => {
    if (canCreate) {
      api.getPublicInterns().then(setInterns).catch(console.error);
    }
  }, [canCreate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const publicUrl = await uploadBase64Image(base64);
      setScreenshotUrl(publicUrl);
      setScreenshotPreview(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

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
        ],
        assigned_intern_ids: assignedInternIds,
      };

      if (editingId) {
        payload.id = editingId;
      }

      await api.saveProject(payload);
      
      setName('');
      setDescription('');
      setGithubUrl('');
      setTechStack('');
      setScreenshotUrl('');
      setScreenshotPreview(null);
      setAssignedInternIds([]);
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
    setScreenshotPreview(proj.screenshots[0] || null);
    setAssignedInternIds(proj.assigned_intern_ids || []);
    setShowForm(true);
  };

  const visibleProjects = isIntern
    ? projects.filter(p => p.owner_id === currentUser.id || p.assigned_intern_ids?.includes(currentUser.id))
    : projects;

  const myProjects = visibleProjects.filter(p => p.owner_id === currentUser.id);
  const allInternProjects = visibleProjects;

  const renderCard = (proj: Project) => {
    const isOwner = proj.owner_id === currentUser.id;
    return (
      <motion.div
        key={proj.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border border-white/30 dark:border-slate-700/40 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/10 flex flex-col hover:shadow-md transition duration-250 group relative"
      >
        {/* Screenshot cover */}
        <div className="h-28 bg-slate-100 dark:bg-slate-950 relative overflow-hidden shrink-0">
          <img 
            src={proj.screenshots[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"} 
            alt={proj.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            {isOwner && proj.github_url ? (
              <a 
                href={proj.github_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-white text-[11px] font-bold flex items-center gap-1 hover:underline"
              >
                <Github className="h-4 w-4" /> View Repo codebase
              </a>
            ) : (
              <span className="text-white/70 text-[11px] font-bold flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Restricted
              </span>
            )}
          </div>

          {/* Owner Badge */}
          {isOwner && (
             <span className="absolute top-3 left-3 px-2.5 py-1 bg-teal-600 text-white rounded-full text-[9px] font-bold shadow-sm">
            My Project
          </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white leading-tight text-sm">{proj.name}</h3>
            {proj.owner_name && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <UserIcon className="h-3 w-3" /> {proj.owner_name}
              </p>
            )}
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{proj.description}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/20 dark:border-slate-700/30">
            {/* Tags */}
            {proj.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {proj.tech_stack.map(tech => (
                  <span key={tech} className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[9px] font-semibold text-teal-200">
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {isOwner && proj.github_url ? (
                <a 
                  href={proj.github_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-slate-300 hover:text-teal-300 flex items-center gap-1.5"
                >
                  <Github className="h-4 w-4" /> Repo
                </a>
              ) : (
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Restricted
                </span>
              )}

              {canCreate && isOwner && (
                <button
                  onClick={() => startEdit(proj)}
                  className="px-2.5 py-1.5 hover:bg-white/10 text-[10px] font-bold text-teal-300 rounded-lg flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Card
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div id="projects-gallery-root" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Projects Registry <Folder className="h-5 w-5 text-teal-400" />
          </h2>
          <p className="text-xs text-slate-300">
            {isIntern ? 'Projects assigned to you by your Tech Lead.' : readOnly ? 'Central registry of all active corporate project pipelines.' : 'Manage, describe, and link your codebases and live links.'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setDescription('');
              setGithubUrl('');
              setTechStack('');
              setScreenshotUrl('');
              setScreenshotPreview(null);
              setAssignedInternIds([]);
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
        {showForm && canCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                {editingId ? 'Modify Project details' : 'Define New Project Entry'} <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{error}</p>}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Project Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. E-Commerce Checkout Revamp" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">GitHub Repo URL *</label>
                <input 
                  type="url" 
                  placeholder="https://github.com/org/repo" 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Short Description *</label>
                <textarea 
                  rows={2} 
                  placeholder="Optimizing checkout pipelines and adding spring-based confetti rewards to checkout cards..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Tech Stack (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="React, TypeScript, Tailwind CSS, Motion" 
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Cover Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition">
                    <Upload className="h-4 w-4 text-slate-300" />
                    <span className="text-xs font-semibold text-slate-200">
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {screenshotPreview && (
                    <img
                      src={screenshotPreview}
                      alt="Preview"
                      className="h-12 w-12 rounded-lg object-cover border border-white/20"
                    />
                  )}
                </div>
                {screenshotUrl && (
                  <p className="text-[10px] text-slate-400 mt-1">Image uploaded successfully.</p>
                )}
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1 mt-3">Or paste cover image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={screenshotUrl}
                  onChange={(e) => { setScreenshotUrl(e.target.value); setScreenshotPreview(e.target.value); }}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>

              {!isIntern && interns.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Assigned Interns (optional)</label>
                  <div className="flex flex-wrap gap-3">
                    {interns.map(intern => (
                      <label key={intern.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedInternIds.includes(intern.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedInternIds([...assignedInternIds, intern.id]);
                            } else {
                              setAssignedInternIds(assignedInternIds.filter(id => id !== intern.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-xs text-slate-200">{intern.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-white/20 text-slate-300 rounded-xl text-xs font-semibold hover:bg-white/10"
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
      ) : visibleProjects.length === 0 ? (
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-12 text-center space-y-3">
          <div className="bg-white/10 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
            <Folder className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">No projects found 📁</p>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              {isIntern ? 'You have not been assigned to any projects yet.' : readOnly ? 'No active corporate project pipelines exist in this directory yet.' : 'Describe and link your first project card to get started and document your work!'}
            </p>
          </div>
        </div>
      ) : isIntern ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map(renderCard)}
        </div>
      ) : readOnly ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(renderCard)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* My Projects */}
          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Folder className="h-4 w-4 text-teal-400" /> My Projects
            </h3>
            {myProjects.length === 0 ? (
              <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-8 text-center space-y-2">
                <p className="text-xs text-slate-400">No projects owned by you yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProjects.map(renderCard)}
              </div>
            )}
          </section>

          {/* All Intern Projects */}
          <section>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-amber-400" /> All Intern Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allInternProjects.map(renderCard)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};








export default MyProjects;
