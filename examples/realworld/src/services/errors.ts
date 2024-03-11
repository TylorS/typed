import { Data } from "effect"

export class Unauthorized extends Data.TaggedError("Unauthorized") {}

export class Unprocessable extends Data.TaggedError("Unprocessable")<ReadonlyArray<string>> {}
