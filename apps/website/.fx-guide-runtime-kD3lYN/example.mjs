import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";
const products = Fx.fromIterable([
    { id: "desk", name: "Standing desk", priceInCents: 49900, active: true },
    { id: "lamp", name: "Desk lamp", priceInCents: 8900, active: false },
]);
const cards = products.pipe(Fx.filterMap((product) => (product.active ? Option.some(product) : Option.none())), Fx.map(({ id, name, priceInCents }) => ({
    id,
    title: name,
    price: `$${(priceInCents / 100).toFixed(2)}`,
})));
const result = await Effect.runPromise(Fx.collectAll(cards));
// [{ id: "desk", title: "Standing desk", price: "$499.00" }]
export const __guideTestResult = await (result);
