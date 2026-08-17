/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../../services/api";
import { User, Project } from "../../types";
import {
  ArrowLeft, Github, Calendar, Users, FolderGit2,
  ExternalLink, Tag, Lock, AlertTriangle
} from "lucide-react";

interface ProjectDetailContentProps {
  projectId: string;
  currentUser: User;
}

export const ProjectDetailContent: React.FC<ProjectDetailContentProps> = ({ projectId, currentUser }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await api.getProject(projectId);
        setProject(data);
      } catch (err: any) {
        setError(err.message || "Failed to load project.");
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20 space-y-3">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
        <p className="text-sm font-bold text-white">{error || "Project not found"}</p>
      </div>
    );
  }

  const isOwner = project.owner_id === currentUser.id;
  const isAssigned = project.assigned_intern_ids?.includes(currentUser.id);

  if (!isOwner && !isAssigned) {
    return (
      <div className="text-center py-20 space-y-3">
        <Lock className="h-10 w-10 text-slate-400 mx-auto" />
        <p className="text-sm font-bold text-white">You do not have access to this project.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/5">
        <div className="h-56 bg-slate-100 dark:bg-slate-950 relative overflow-hidden shrink-0">
          <img
            src={project.screenshots[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"}
            alt={project.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white leading-tight">{project.name}</h1>
            {project.owner_name && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Owned by {project.owner_name}
              </p>
            )}
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tech_stack.length > 0 ? (
              project.tech_stack.map((tech) => (
                <span key={tech} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-[10px] font-bold text-teal-200">
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">No tech stack specified</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</p>
              <div className="space-y-1 text-xs text-slate-300">
                {project.start_date && (
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-teal-400" /> Starts: {new Date(project.start_date).toLocaleDateString()}</span>
                )}
                {project.end_date && (
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-rose-400" /> Ends: {new Date(project.end_date).toLocaleDateString()}</span>
                )}
                {!project.start_date && !project.end_date && (
                  <span className="text-slate-500">No dates set</span>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 border border-white/20 text-slate-200 capitalize">
                {project.status || "Active"}
              </span>
            </div>
          </div>

          {project.github_url && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Repository</p>
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-teal-200 transition"
              >
                <Github className="h-4 w-4" /> View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface InternProjectDetailProps {
  projectId: string;
  currentUser: User;
}

export const InternProjectDetail: React.FC<InternProjectDetailProps> = ({ projectId, currentUser }) => {
  return <ProjectDetailContent projectId={projectId} currentUser={currentUser} />;
};
