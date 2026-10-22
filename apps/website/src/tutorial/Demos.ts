// Each island loads its own example; the Quick Start does not need the TodoMVC curriculum.
export const curriculumDemos = {
  "counter-reactive": () =>
    import("./examples/learn-3/src/Counter.js").then(({ Counter }) => Counter),
  "counter-component": () =>
    import("./examples/learn-4/src/Counter.js").then(({ Counter }) => Counter),
  "counter-hydrated": () =>
    import("./examples/learn-6/src/Counter.js").then(({ Counter }) => Counter),
  "todo-4": () => import("./examples/todo-4/src/preview.js").then(({ Preview }) => Preview),
  "todo-5": () => import("./examples/todo-5/src/preview.js").then(({ Preview }) => Preview),
  "todo-6": () => import("./examples/todo-6/src/preview.js").then(({ Preview }) => Preview),
  "todo-7": () => import("./examples/todo-7/src/preview.js").then(({ Preview }) => Preview),
  "todo-8": () => import("./examples/todo-8/src/preview.js").then(({ Preview }) => Preview),
  "todo-9": () => import("./TodoMvc.js").then(({ TodoMvc }) => TodoMvc),
  "todo-10": () => import("./TodoMvc.js").then(({ TodoMvc }) => TodoMvc),
} as const;

export const curriculumDemo = async (id: string) => {
  if (!Object.hasOwn(curriculumDemos, id)) throw new Error(`Unknown curriculum demo: ${id}`);
  return curriculumDemos[id as keyof typeof curriculumDemos]();
};
