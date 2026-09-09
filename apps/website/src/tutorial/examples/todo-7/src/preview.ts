import { Layer } from "effect";
import { Ids } from "@typed/id/Ids";
import { DateTimes } from "@typed/id/DateTimes";
import { Fx } from "@typed/fx";
import { TodoApp } from "./presentation.js";
import { ServerRouter } from "@typed/router";
import { makeServices } from "./infrastructure.js";

// A private history lets the embedded app navigate without leaving this lesson.
export const Preview = TodoApp.pipe(
  Fx.provide(makeServices(ServerRouter({ url: "https://tutorial.local/" })).pipe(
    Layer.provide([Ids.Default, DateTimes.Default]),
  )),
);
