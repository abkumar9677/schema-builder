import { Plus } from "lucide-react";
import { Project } from "../lib/api";

export function ProjectPanel({
  projects,
  selectedProjectId,
  isLoading,
  onCreateClick,
  onSelectProject
}: {
  projects: Project[];
  selectedProjectId?: string;
  isLoading: boolean;
  onCreateClick: () => void;
  onSelectProject: (projectId: string) => void;
}) {
  return (
    <aside className="border-r border-line bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Projects</h2>
        <button onClick={onCreateClick} className="grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-slate-50" title="Create project">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-2">
        {isLoading && <div className="rounded-md border border-line px-3 py-3 text-sm text-slate-500">Loading projects...</div>}
        {!isLoading && projects.length === 0 && (
          <div className="rounded-md border border-dashed border-line px-3 py-4 text-sm text-slate-500">
            No projects yet. Use the plus button to generate your first database design.
          </div>
        )}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full rounded-md border px-3 py-3 text-left ${project.id === selectedProjectId ? "border-brand bg-teal-50" : "border-line bg-white"}`}
          >
            <div className="font-medium">{project.name}</div>
            <div className="text-xs text-slate-500">{project.rdbmsType} · {project.tables?.length ?? 0} tables</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
