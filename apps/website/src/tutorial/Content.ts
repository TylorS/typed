import { Schema } from "effect";
import { readFileSync, readdirSync } from "node:fs";
import { parseFrontmatter } from "../docs/Frontmatter.js";
import { parseCurriculumFiles, type CurriculumFile } from "./Files.js";
import { counterLessonPath, isQuickStartSection } from "./Routes.js";
export type { CurriculumFile } from "./Files.js";

export interface QuickStartSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly files: ReadonlyArray<CurriculumFile>;
  readonly demo?: "counter-reactive" | "counter-component" | "counter-hydrated";
}

export interface TutorialStep {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly files: ReadonlyArray<CurriculumFile>;
  readonly demo?: `todo-${number}`;
  readonly architecture: ReadonlyArray<
    "domain" | "application" | "presentation" | "infrastructure" | "main"
  >;
}

const commonFields = {
  title: Schema.String,
  summary: Schema.String,
  order: Schema.Number,
};

const QuickStartFrontmatter = Schema.Struct({
  ...commonFields,
  id: Schema.String,
  demo: Schema.optionalKey(
    Schema.Literals(["counter-reactive", "counter-component", "counter-hydrated"]),
  ),
});

const TutorialFrontmatter = Schema.Struct({
  ...commonFields,
  slug: Schema.String,
  demo: Schema.optionalKey(
    Schema.Literals(["todo-4", "todo-5", "todo-6", "todo-7", "todo-8", "todo-9", "todo-10"]),
  ),
  architecture: Schema.Array(
    Schema.Literals(["domain", "application", "presentation", "infrastructure", "main"]),
  ),
});

const loadDocuments = (directory: URL) =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map(({ name }) => {
      const { attributes, body } = parseFrontmatter(
        name,
        readFileSync(new URL(name, directory), "utf8").replaceAll("\r\n", "\n"),
      );
      return { attributes, ...parseCurriculumFiles(name, body) };
    });

export const quickStartSections: ReadonlyArray<QuickStartSection> = loadDocuments(
  new URL("../../content/learn/", import.meta.url),
)
  .map(({ attributes, ...content }) => ({
    ...Schema.decodeUnknownSync(QuickStartFrontmatter)(attributes),
    ...content,
  }))
  .sort((left, right) => left.order - right.order)
  .map(({ order: _order, ...section }) => section);

export const tutorialSteps: ReadonlyArray<TutorialStep> = loadDocuments(
  new URL("../../content/tutorial/", import.meta.url),
)
  .map(({ attributes, ...content }) => ({
    ...Schema.decodeUnknownSync(TutorialFrontmatter)(attributes),
    ...content,
  }))
  .sort((left, right) => left.order - right.order)
  .map(({ order: _order, ...step }) => step);

export const tutorialStepBySlug = new Map(tutorialSteps.map((step) => [step.slug, step]));

export const curriculumSearchEntries = [
  {
    id: "curriculum:quick-start",
    title: "Quick Start",
    kind: "guide" as const,
    text: quickStartSections
      .filter(({ id }) => isQuickStartSection(id))
      .flatMap(({ title, summary }) => [title, summary])
      .join(" "),
    href: "/explore/quick-start",
  },
  ...quickStartSections
    .filter(({ id }) => !isQuickStartSection(id))
    .map((section) => ({
      id: `curriculum:counter:${section.id}`,
      title: section.title,
      kind: "guide" as const,
      text: `${section.title} ${section.summary} ${section.body}`,
      href: counterLessonPath(section.id),
    })),
  {
    id: "curriculum:tutorial",
    title: "TodoMVC tutorial",
    kind: "guide" as const,
    text: tutorialSteps.flatMap(({ title, summary }) => [title, summary]).join(" "),
    href: "/explore/tutorial",
  },
  ...tutorialSteps.map((step) => ({
    id: `curriculum:tutorial:${step.slug}`,
    title: step.title,
    kind: "guide" as const,
    text: `${step.title} ${step.summary} ${step.body}`,
    href: `/explore/tutorial/${step.slug}`,
  })),
] as const;
