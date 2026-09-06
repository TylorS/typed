export const isQuickStartSection = (id: string): boolean =>
  id === "install" || id === "reactive-state";

export const counterLessonPath = (id: string): string =>
  `/explore/counter/${id}`;

// Quick Start already mounts the reactive counter. Continue with derived state,
// then inspect mounting before taking that same view to the server.
const counterOrder = [
  "component-lifetime",
  "client-only",
  "server-html",
  "hydrate-state",
];

export function orderCounterLessons<
  T extends { readonly data: { readonly id: string } },
>(entries: ReadonlyArray<T>): T[] {
  return counterOrder.map((id) => {
    const entry = entries.find((entry) => entry.data.id === id);
    if (!entry) throw new Error(`Missing counter lesson: ${id}`);
    return entry;
  });
}

export function orderTutorialSteps<
  T extends {
    readonly data: { readonly order: number; readonly slug: string };
  },
>(entries: ReadonlyArray<T>): T[] {
  return entries.toSorted(
    (a, b) =>
      a.data.order - b.data.order || a.data.slug.localeCompare(b.data.slug),
  );
}
