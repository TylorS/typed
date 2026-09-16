import { Fx } from "@typed/fx";
import { ServerRouter } from "@typed/router";
import { TodoApp } from "./presentation.js";
import { makeServices } from "./infrastructure.js";

// Only the runtime router changes when this example is embedded in the website.
export const Preview = TodoApp.pipe(
  Fx.provide(makeServices(ServerRouter({ url: "https://tutorial.local/" }))),
);
