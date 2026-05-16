import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("renders login by default", () => {
    render(<App />);
    expect(screen.getByText("Sign in to continue your schema workspace.")).toBeInTheDocument();
  });

  it("renders schema builder workspace", () => {
    localStorage.setItem("schema_builder_token", "test-token");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => {
        if (url.endsWith("/api/projects/project-1")) {
          return {
            id: "project-1",
            name: "Commerce API",
            description: "Ecommerce backend",
            rdbmsType: "postgresql",
            tables: [
              {
                id: "table-1",
                projectId: "project-1",
                name: "orders",
                description: "Customer orders",
                schemas: [
                  {
                    id: "schema-1",
                    version: 1,
                    createdAt: new Date().toISOString(),
                    indexesJson: [],
                    columnsJson: [{ name: "id", type: "UUID", nullable: false, primaryKey: true }]
                  }
                ]
              }
            ],
            references: []
          };
        }
        return [{ id: "project-1", name: "Commerce API", rdbmsType: "postgresql", tables: [] }];
      }
    })));
    render(<App />);
    expect(screen.getByText("AI Schema Builder")).toBeInTheDocument();
    return expect(screen.findByText("Editable Schema Grid")).resolves.toBeInTheDocument();
  });
});
