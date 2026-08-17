/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/src/services/api";
import { User, Project } from "@/src/types";
import { ProjectDetailContent } from "@/src/views/intern/InternProjectDetail";
import { DailyLogForm } from "@/src/components/intern/DailyLogForm";
import { X, Loader2 } from "lucide-react";

interface ProjectDetailModalProps {
  projectId: string | null;
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  projectId,
  user,
  isOpen,
  onClose,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) {
      setProject(null);
      setError(null);
      return;
    }

    let isCancelled = false;

    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getProject(projectId);
        if (!isCancelled) {
          setProject(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to load project.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !projectId) return null;

  const handleLogSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Project Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm font-bold text-rose-400">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && project && (
            <>
              <ProjectDetailContent projectId={projectId} currentUser={user} />

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Submit Daily Log</h3>
                <DailyLogForm
                  user={user}
                  projects={[project]}
                  onSuccess={handleLogSuccess}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
