import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { ProjectPanel } from "../components/ProjectPanel";
import { SchemaWorkspace } from "../components/SchemaWorkspace";
import { GenerateProjectModal } from "../components/GenerateProjectModal";
import { GeminiKeyModal } from "../components/GeminiKeyModal";
import { AuthPage } from "./AuthPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { ApiError, clearAuthToken, exportTableSql, generateTableSchema, getAuthToken, getProject, listProjects, Project, setAuthToken } from "../lib/api";

export function App() {
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [authError, setAuthError] = useState("");
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset_token") ?? "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGeminiKeyOpen, setIsGeminiKeyOpen] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isGeneratingTable, setIsGeneratingTable] = useState(false);

  async function refreshProjects(nextSelectedId?: string) {
    setIsProjectsLoading(true);
    try {
      const loadedProjects = await listProjects();
      setProjects(loadedProjects);
      const selectedId = nextSelectedId ?? selectedProject?.id ?? loadedProjects[0]?.id;
      if (selectedId) await loadProject(selectedId);
      if (!selectedId) setSelectedProject(undefined);
    } catch {
      setProjects([]);
      setSelectedProject(undefined);
    } finally {
      setIsProjectsLoading(false);
    }
  }

  async function loadProject(projectId: string) {
    setIsProjectLoading(true);
    try {
      setSelectedProject(await getProject(projectId));
    } catch {
      setSelectedProject(undefined);
    } finally {
      setIsProjectLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void refreshProjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("auth_error");
    const nextResetToken = params.get("reset_token");
    if (!token && !error && !nextResetToken) return;

    if (nextResetToken) {
      setResetToken(nextResetToken);
      return;
    }

    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      setAuthError("");
    }
    if (error) setAuthError(error);

    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  if (resetToken && !isAuthenticated) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onAuthenticated={() => {
          setResetToken("");
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsAuthenticated(true);
        }}
        onBackToLogin={() => {
          setResetToken("");
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <AuthPage authError={authError} onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="grid min-h-full grid-rows-[auto_1fr]">
      <Header
        quotaExhausted={quotaExhausted}
        onGeminiKeyClick={() => setIsGeminiKeyOpen(true)}
        onLogout={() => {
          clearAuthToken();
          setProjects([]);
          setSelectedProject(undefined);
          setIsAuthenticated(false);
        }}
      />
      <div className="grid min-h-0 grid-cols-[280px_1fr]">
        <ProjectPanel
          projects={projects}
          selectedProjectId={selectedProject?.id}
          isLoading={isProjectsLoading}
          onCreateClick={() => setIsCreateOpen(true)}
          onSelectProject={(projectId) => void loadProject(projectId)}
        />
        <SchemaWorkspace
          project={selectedProject}
          isLoading={isProjectLoading}
          isGeneratingTable={isGeneratingTable}
          onGenerateTable={async (tableId) => {
            if (!selectedProject) return;
            setIsGeneratingTable(true);
            try {
              await generateTableSchema(selectedProject.id, tableId);
              await loadProject(selectedProject.id);
            } catch (caughtError) {
              const apiError = caughtError as ApiError;
              if (apiError.code === "AI_QUOTA_EXHAUSTED") {
                setQuotaExhausted(true);
                setIsGeminiKeyOpen(true);
              }
            } finally {
              setIsGeneratingTable(false);
            }
          }}
          onExportSql={async (tableId) => {
            const sql = await exportTableSql(tableId);
            const blob = new Blob([sql], { type: "text/sql" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${selectedProject?.name ?? "schema"}.sql`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        />
      </div>
      <GenerateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onQuota={() => {
          setQuotaExhausted(true);
          setIsGeminiKeyOpen(true);
        }}
        onGenerated={async (project) => {
          await refreshProjects(project.id);
        }}
      />
      <GeminiKeyModal
        isOpen={isGeminiKeyOpen}
        quotaExhausted={quotaExhausted}
        onClose={() => setIsGeminiKeyOpen(false)}
        onSaved={() => setQuotaExhausted(false)}
      />
    </div>
  );
}
