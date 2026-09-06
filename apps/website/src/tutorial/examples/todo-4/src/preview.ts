import { Fx } from "@typed/fx";
import { TodoApp } from "./presentation.js";
import { Services } from "./infrastructure.js";

export const Preview = TodoApp.pipe(Fx.provide(Services));
