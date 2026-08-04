/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, Project } from '../../types';
import {
  Plus, Calendar, X, ChevronDown, Trash2, Users, Upload
} from 'lucide-react';
import { scaleIn } from '../../utils/motion';
import { uploadBase64Image } from '../../lib/supabase';

interface UpcomingProjectsManagerProps {
  currentUser: User;
  onRefresh?: () => void;
}

export const UpcomingProjectsManager: React.FC<UpcomingProjectsManagerProps> = ({ currentUser, onRefresh }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [techLeads, setTechLeads] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedTechLeadIds, setAssignedTechLeadIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'planned' | 'upcoming' | 'active'>('upcoming');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const [projList, leads] = await Promise.all([
        api.getProjects({ status: 'upcoming' }),
        api.getPublicTechLeads(),
      ]);
      setProjects(projList);
      setTechLeads(leads);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to load upcoming projects.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setScreenshotUrl('');
    setScreenshotPreview(null);
    setStartDate('');
    setEndDate('');
    setAssignedTechLeadIds([]);
    setStatus('upcoming');
    setEditingProject(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (proj: Project) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description);
    setScreenshotUrl(proj.screenshots[0] || '');
    setScreenshotPreview(proj.screenshots[0] || null);
    setStartDate(proj.start_date || '');
    setEndDate(proj.end_date || '');
    setAssignedTechLeadIds(proj.assigned_tech_lead_ids || []);
    setStatus(proj.status === 'planned' || proj.status === 'upcoming' || proj.status === 'active' ? proj.status : 'upcoming');
    setShowForm(true);
  };

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
       setMessage(null);

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
      setMessage({ type: 'error', text: err.message || 'Failed to upload image.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setMessage({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const payload: Partial<Project> = {
        name: name.trim(),
        description: description.trim(),
        owner_id: currentUser.id,
        status,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        assigned_tech_lead_ids: assignedTechLeadIds,
        screenshots: screenshotUrl ? [screenshotUrl] : [],
      };

      if (editingProject) {
        payload.id = editingProject.id;
      }

      await api.saveProject(payload);

      setMessage({ type: 'success', text: editingProject ? 'Project updated successfully.' : 'Project created successfully.' });
      resetForm();
      setShowForm(false);
      await loadProjects();
      onRefresh?.();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save project.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (proj: Project) => {
    if (!confirm('Archive this upcoming project?')) return;
    try {
      await api.deleteProject(proj.id);
      setMessage({ type: 'success', text: 'Project archived.' });
      await loadProjects();
      onRefresh?.();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to archive project.' });
    }
  };

  return (
    <div id="upcoming-projects-manager-root" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Upcoming Projects Pipeline <Calendar className="h-5 w-5 text-teal-600" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add and manage upcoming projects visible to all tech leads.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

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
                {editingProject ? 'Modify Upcoming Project' : 'Define New Upcoming Project'} <Calendar className="h-3.5 w-3.5 text-amber-500" />
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Short Description *</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of the upcoming project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'planned' | 'upcoming' | 'active')}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white appearance-none"
                  >
                    <option value="planned">Planned</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Assigned Tech Leads (optional)</label>
                <div className="flex flex-wrap gap-3">
                  {techLeads.map(lead => (
                    <label key={lead.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignedTechLeadIds.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedTechLeadIds([...assignedTechLeadIds, lead.id]);
                          } else {
                            setAssignedTechLeadIds(assignedTechLeadIds.filter(id => id !== lead.id));
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{lead.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Cover Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                    />
                  )}
                </div>
                {screenshotUrl && (
                  <p className="text-[10px] text-slate-400 mt-1">Image uploaded successfully.</p>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Save Project'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-12 text-center space-y-3">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">No upcoming projects scheduled yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create an upcoming project to make it visible to all tech leads in their dashboard.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const leads = techLeads.filter(l => proj.assigned_tech_lead_ids?.includes(l.id));
            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/5 flex flex-col hover:shadow-md transition duration-250 group relative"
              >
                <div className="h-44 bg-slate-100 dark:bg-slate-950 relative overflow-hidden shrink-0">
                  <img
                    src={proj.screenshots[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight">{proj.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{proj.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {proj.start_date && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Starts: {new Date(proj.start_date).toLocaleDateString()}</span>
                      )}
                      {leads.length > 0 && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Assigned to: {leads.map(l => l.name).join(', ')}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(proj)}
                          className="px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-950 text-[10px] font-bold text-teal-600 dark:text-teal-400 rounded-lg flex items-center gap-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(proj)}
                          className="px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-950 text-[10px] font-bold text-rose-600 rounded-lg flex items-center gap-1"
                        >
                          Archive
                        </button>
                      </div>
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

export default UpcomingProjectsManager;
