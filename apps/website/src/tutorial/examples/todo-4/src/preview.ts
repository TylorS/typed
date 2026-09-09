import { Layer } from "effect";
import { Ids } from "@typed/id/Ids";
import { DateTimes } from "@typed/id/DateTimes";
import { Fx } from "@typed/fx";
import { TodoApp } from "./presentation.js";
import { Services } from "./infrastructure.js";

export const Preview = TodoApp.pipe(Fx.provide(Services.pipe(Layer.provide([Ids.Default, DateTimes.Default]))));
