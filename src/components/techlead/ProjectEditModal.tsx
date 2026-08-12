/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Github, Calendar, Users, UserCheck } from "lucide-react";
import { scaleIn } from "../../utils/motion";
import { uploadBase64Image } from "../../lib/supabase";
import { User, Project, ProjectStatus } from "../../types";

interface ProjectEditModalProps {
  show: boolean;
  onClose: () => void;
  project: Project | null;
  techLeads: User[];
  interns: User[];
  onSubmit: (data: {
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
  }) => Promise<void>;
  submitting: boolean;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  show,
  onClose,
  project,
  techLeads,
  interns,
  onSubmit,
  submitting,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedTechLeadIds, setAssignedTechLeadIds] = useState<string[]>([]);
  const [assignedInternIds, setAssignedInternIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'planned' | 'upcoming' | 'active' | 'completed' | 'archived'>('upcoming');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setGithubUrl(project.github_url);
      setTechStack(project.tech_stack.join(', '));
      setScreenshotUrl(project.screenshots[0] || '');
      setScreenshotPreview(project.screenshots[0] || null);
      setStartDate(project.start_date || '');
      setEndDate(project.end_date || '');
      setAssignedTechLeadIds(project.assigned_tech_lead_ids || []);
      setAssignedInternIds(project.assigned_intern_ids || []);
      const validStatus = ['planned', 'upcoming', 'active', 'completed', 'archived'].includes(project.status || '') 
        ? (project.status as any) 
        : 'upcoming';
      setStatus(validStatus);
      setError('');
    }
  }, [project]);

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
    if (!name.trim() || !description.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    await onSubmit({
      id: project!.id,
      name: name.trim(),
      description: description.trim(),
      github_url: githubUrl.trim(),
      tech_stack: techStack.split(',').map(t => t.trim()).filter(Boolean),
      screenshots: screenshotUrl ? [screenshotUrl] : [],
      status: status.toUpperCase() as ProjectStatus,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      assigned_tech_lead_ids: assignedTechLeadIds,
      assigned_intern_ids: assignedInternIds,
    });
  };

  if (!show || !project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center pb-3 border-b border-white/20 mb-4">
            <h3 className="text-base font-extrabold text-white">Edit Project</h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Short Description *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">GitHub Repo URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300"
              >
                <option value="planned">Planned</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
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
            </div>

            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-2">Assigned Tech Leads</label>
              <div className="flex flex-wrap gap-3">
                {techLeads.length === 0 ? (
                  <p className="text-xs text-slate-500">No tech leads available.</p>
                ) : (
                  techLeads.map(lead => (
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
                      <span className="text-xs text-slate-200">{lead.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-2">Assigned Interns</label>
              <div className="flex flex-wrap gap-3">
                {interns.length === 0 ? (
                  <p className="text-xs text-slate-500">No interns available.</p>
                ) : (
                  interns.map(intern => (
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
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/20 text-slate-300 rounded-xl text-xs font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
