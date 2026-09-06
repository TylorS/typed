import { Effect } from "effect";
import { Fx } from "@typed/fx";
const cached = Fx.fromIterable(["cached: Ada", "cached: Lin"]);
const live = Fx.fromIterable(["live: Grace"]);
const people = Fx.concat(cached, live);
const values = await Effect.runPromise(Fx.collectAll(people));
// ["cached: Ada", "cached: Lin", "live: Grace"]
export const __guideTestResult = await (values);
