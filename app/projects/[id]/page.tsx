import React from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { InternProjectDetail } from "@/src/views/intern/InternProjectDetail";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = await params;
  const projectId = resolvedParams?.id;

  return (
    <ProjectDetailClient projectId={projectId} />
  );
}

function ProjectDetailClient({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { settings } = useSettings();

  if (!user) {
    return (
      <DashboardShell settings={settings} activeTab="projects" setActiveTab={() => {}}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell settings={settings} activeTab="projects" setActiveTab={() => {}}>
      <InternProjectDetail projectId={projectId} currentUser={user} />
    </DashboardShell>
  );
}
