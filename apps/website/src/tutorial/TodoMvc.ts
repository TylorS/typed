import { Fx } from "@typed/fx";
import { ServerRouter } from "@typed/router";
import { TodoApp } from "../../../../examples/todomvc/src/presentation.js";
import { makeServices } from "../../../../examples/todomvc/src/infrastructure.js";

// The complete demo is the example itself, with private navigation for its island.
export const TodoMvc = TodoApp.pipe(
  Fx.provide(makeServices(ServerRouter({ url: "https://tutorial.local/" }))),
);
