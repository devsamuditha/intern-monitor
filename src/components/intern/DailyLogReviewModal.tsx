/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, CheckCircle2, Github, Tag, FileText, Link as LinkIcon, Image, Trash2, AlertCircle } from 'lucide-react';
import { Project } from '../../types';

interface LogData {
  selectedProjectId: string;
  summary: string;
  technologies: string[];
  changes: string;
  githubUrl: string;
  screenshotUrl: string;
}

interface DailyLogReviewModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projects: Project[];
  logData: LogData;
  onFieldChange: (data: Partial<LogData>) => void;
  submitting?: boolean;
}

const COMMON_TECHS = ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Motion', 'Python', 'FastAPI', 'Docker', 'Next.js'];

export const DailyLogReviewModal: React.FC<DailyLogReviewModalProps> = ({
  show,
  onClose,
  onConfirm,
  projects,
  logData,
  onFieldChange,
  submitting = false,
}) => {
  const [localData, setLocalData] = useState<LogData>(logData);
  const [errors, setErrors] = useState<Partial<Record<keyof LogData, string>>>({});
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalData(logData);
    setErrors({});
  }, [show, logData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LogData, string>> = {};
    if (!localData.selectedProjectId) newErrors.selectedProjectId = 'Please select a project.';
    if (!localData.summary.trim()) newErrors.summary = 'Please describe what you worked on today.';
    if (!localData.changes.trim()) newErrors.changes = 'Please outline what changed today.';
    if (localData.githubUrl && !localData.githubUrl.startsWith('http://') && !localData.githubUrl.startsWith('https://')) {
      newErrors.githubUrl = 'Please enter a valid URL starting with http:// or https://';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onFieldChange(localData);
    onConfirm();
  };

  const toggleTech = (tech: string) => {
    const updated = localData.technologies.includes(tech)
      ? localData.technologies.filter(t => t !== tech)
      : [...localData.technologies, tech];
    setLocalData(prev => ({ ...prev, technologies: updated }));
    onFieldChange({ technologies: updated });
  };

  const handleAddCustomTech = (e: React.FormEvent) => {
    e.preventDefault();
    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
    const clean = input.value.trim();
    if (clean && !localData.technologies.includes(clean)) {
      const updated = [...localData.technologies, clean];
      setLocalData(prev => ({ ...prev, technologies: updated }));
      onFieldChange({ technologies: updated });
    }
    input.value = '';
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setLocalData(prev => ({ ...prev, selectedProjectId: pId }));
    onFieldChange({ selectedProjectId: pId });
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalData(prev => ({ ...prev, screenshotUrl: reader.result as string }));
        onFieldChange({ screenshotUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 bg-teal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-teal-400" />
            Review Your Daily Journal Entry
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Project Selector */}
          <div>
            <label className="block text-xs font-medium text-teal-100 mb-1">Project Name</label>
            <select
              value={localData.selectedProjectId}
              onChange={handleProjectChange}
              className="w-full text-sm rounded-xl border border-white/20 bg-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.selectedProjectId && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.selectedProjectId}
              </p>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-teal-100 mb-1 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Implemented user auth, fixed checkout validation bug"
              value={localData.summary}
              onChange={(e) => {
                setLocalData(prev => ({ ...prev, summary: e.target.value }));
                onFieldChange({ summary: e.target.value });
              }}
              className="w-full text-sm rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2 placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            {errors.summary && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.summary}
              </p>
            )}
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-xs font-medium text-teal-100 mb-1 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Technologies Used
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1 rounded-xl">
              {COMMON_TECHS.map(tech => {
                const active = localData.technologies.includes(tech);
                return (
                  <button
                    type="button"
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom tech tag..."
                className="flex-1 text-xs rounded-lg border border-white/20 bg-white/5 text-white px-3 py-1.5 placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const clean = input.value.trim();
                    if (clean && !localData.technologies.includes(clean)) {
                      const updated = [...localData.technologies, clean];
                      setLocalData(prev => ({ ...prev, technologies: updated }));
                      onFieldChange({ technologies: updated });
                    }
                    input.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Detailed Changes */}
          <div>
            <label className="block text-xs font-medium text-teal-100 mb-1">Detailed Changes (Changelog / bullet style)</label>
            <textarea
              rows={3}
              placeholder="- Fixed responsive CSS wrapping bug on shipping panels"
              value={localData.changes}
              onChange={(e) => {
                setLocalData(prev => ({ ...prev, changes: e.target.value }));
                onFieldChange({ changes: e.target.value });
              }}
              className="w-full text-sm rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2 placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-xs"
            />
            {errors.changes && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.changes}
              </p>
            )}
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-xs font-medium text-teal-100 mb-1 flex items-center gap-1">
              <Github className="h-3 w-3" /> GitHub Repo URL
            </label>
            <input
              type="url"
              placeholder="https://github.com/interntrack-org/checkout-revamp/commit/main"
              value={localData.githubUrl}
              onChange={(e) => {
                setLocalData(prev => ({ ...prev, githubUrl: e.target.value }));
                onFieldChange({ githubUrl: e.target.value });
              }}
              className="w-full text-sm rounded-xl border border-white/20 bg-white/5 text-white px-3 py-2 placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            {errors.githubUrl && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.githubUrl}
              </p>
            )}
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-xs font-medium text-teal-100 mb-1">Screenshot Upload</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-teal-500 bg-teal-500/20'
                  : 'border-white/20 hover:border-teal-400 bg-white/5'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="modal-file-upload"
              />

              {localData.screenshotUrl ? (
                <div className="relative group max-w-xs mx-auto">
                  <img
                    src={localData.screenshotUrl}
                    alt="Uploaded preview"
                    className="rounded-lg max-h-40 object-cover w-full shadow-sm border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLocalData(prev => ({ ...prev, screenshotUrl: '' }));
                      onFieldChange({ screenshotUrl: '' });
                    }}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label htmlFor="modal-file-upload" className="block cursor-pointer">
                  <Image className="mx-auto h-6 w-6 text-white/50 mb-1.5" />
                  <p className="text-xs font-medium text-white/80">Drag & drop or <span className="text-teal-400 underline">browse</span></p>
                  <p className="text-[10px] text-white/50 mt-1">PNG, JPG, GIF up to 5MB</p>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:bg-white/10 transition"
          >
            Go Back & Edit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};