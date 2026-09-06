import { Counter as Reactive } from "./examples/learn-3/src/Counter.js";
import { Counter as Component } from "./examples/learn-4/src/Counter.js";
import { Counter as Hydrated } from "./examples/learn-6/src/Counter.js";
import { Preview as Todo4 } from "./examples/todo-4/src/preview.js";
import { Preview as Todo5 } from "./examples/todo-5/src/preview.js";
import { Preview as Todo6 } from "./examples/todo-6/src/preview.js";
import { Preview as Todo7 } from "./examples/todo-7/src/preview.js";
import { Preview as Todo8 } from "./examples/todo-8/src/preview.js";
import { Preview as Todo9 } from "./examples/todo-9/src/preview.js";
import { Preview as Todo10 } from "./examples/todo-10/src/preview.js";

export const curriculumDemos = {
  "counter-reactive": Reactive,
  "counter-component": Component,
  "counter-hydrated": Hydrated,
  "todo-4": Todo4,
  "todo-5": Todo5,
  "todo-6": Todo6,
  "todo-7": Todo7,
  "todo-8": Todo8,
  "todo-9": Todo9,
  "todo-10": Todo10,
} as const;

export const curriculumDemo = (id: string) =>
  curriculumDemos[id as keyof typeof curriculumDemos];
