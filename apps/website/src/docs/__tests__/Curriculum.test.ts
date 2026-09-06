import { describe, expect, it } from "vitest";
import {
  curriculumSearchEntries,
  quickStartSections,
  tutorialSteps,
} from "../../tutorial/Content.js";
import { counterLessonPath, isQuickStartSection } from "../../tutorial/Routes.js";

const fileAt = (slug: string, name: string): string => {
  const source = tutorialSteps
    .find((step) => step.slug === slug)
    ?.files.find((file) => file.name === name)?.source;
  if (source === undefined) throw new Error(`Missing ${name} in tutorial step ${slug}`);
  return source;
};

describe("Quick Start and TodoMVC curriculum", () => {
  it("keeps Quick Start to setup and the counter, with searchable follow-up lessons", () => {
    expect(
      quickStartSections.filter(({ id }) => isQuickStartSection(id)).map(({ id }) => id),
    ).toEqual(["install", "reactive-state"]);
    const followups = quickStartSections.filter(({ id }) => !isQuickStartSection(id));
    expect(followups.map(({ id }) => id)).toEqual([
      "client-only",
      "component-lifetime",
      "server-html",
      "hydrate-state",
    ]);
    for (const { id, title } of followups) {
      expect(
        curriculumSearchEntries.find((entry) => entry.href === counterLessonPath(id))?.title,
      ).toBe(title);
    }
    expect(
      curriculumSearchEntries.find(({ id }) => id === "curriculum:quick-start")?.text,
    ).not.toMatch(/hydrat|server|lifetime/iu);
  });

  it("keeps every authored step addressable and ordered", () => {
    expect(quickStartSections.map(({ id }) => id)).toEqual([
      "install",
      "client-only",
      "reactive-state",
      "component-lifetime",
      "server-html",
      "hydrate-state",
    ]);
    expect(tutorialSteps.map(({ slug }) => slug)).toEqual([
      "model-the-domain",
      "application-state",
      "create-a-todo",
      "render-the-shell",
      "render-keyed-items",
      "derive-the-footer",
      "route-the-filter",
      "persist-the-list",
      "assemble-the-application",
      "test-the-boundaries",
    ]);
    expect(tutorialSteps.at(-1)?.architecture).toEqual([
      "domain",
      "application",
      "presentation",
      "infrastructure",
      "main",
    ]);
  });

  it("introduces Counter state, component scope, and hydration as distinct milestones", () => {
    expect(
      quickStartSections.filter(({ demo }) => demo).map(({ id, demo }) => ({ id, demo })),
    ).toEqual([
      { id: "reactive-state", demo: "counter-reactive" },
      { id: "component-lifetime", demo: "counter-component" },
      { id: "hydrate-state", demo: "counter-hydrated" },
    ]);
    const hydration = quickStartSections.find(({ id }) => id === "hydrate-state")!;
    expect(hydration.files.map(({ name }) => name)).toEqual(["src/Counter.ts", "src/client.ts"]);
    expect(hydration.files[0]!.source).toContain("RefSubject.hydrate");
    expect(hydration.files[1]!.source).toContain("DomRenderTemplate.using(document)");
  });

  it("introduces TodoMVC previews only when there is presentation to exercise", () => {
    expect(tutorialSteps.slice(0, 3).every(({ demo }) => demo === undefined)).toBe(true);
    expect(tutorialSteps.slice(3).map(({ demo }) => demo)).toEqual([
      "todo-4",
      "todo-5",
      "todo-6",
      "todo-7",
      "todo-8",
      "todo-9",
      "todo-10",
    ]);
    const shell = fileAt("render-the-shell", "src/presentation.ts");
    expect(shell).toContain('placeholder="What needs to be done?"');
    expect(shell).not.toContain("many(");
    expect(fileAt("render-keyed-items", "src/presentation.ts")).toContain("many(App.TodoList");
  });

  it("keeps the TodoMVC progression client-only", () => {
    const authoredTutorial = tutorialSteps
      .flatMap(({ title, summary, body, files }) => [
        title,
        summary,
        body,
        ...files.map(({ source }) => source),
      ])
      .join("\n");

    expect(authoredTutorial).not.toMatch(/hydrat/iu);
    expect(fileAt("assemble-the-application", "src/main.ts")).toContain(
      "render(TodoApp, document.body)",
    );
  });

  it("adds complete file snapshots at the milestone that introduces each responsibility", () => {
    expect(fileAt("application-state", "src/application.ts")).not.toContain(
      "export const Todos = TodoList",
    );
    const creation = fileAt("create-a-todo", "src/application.ts");
    expect(creation).toContain("createTodo");
    expect(creation).not.toContain("toggleTodoCompleted");
    expect(fileAt("render-keyed-items", "src/application.ts")).toContain("toggleTodoCompleted");
    expect(fileAt("render-keyed-items", "src/presentation.ts")).toContain("App.TodoList");
    expect(fileAt("route-the-filter", "src/presentation.ts")).toContain("App.Todos");
    expect(fileAt("persist-the-list", "src/infrastructure.ts")).toContain("Schema.encodeEffect");
    expect(fileAt("persist-the-list", "src/infrastructure.ts")).toContain("localStorage.setItem");
  });
});
