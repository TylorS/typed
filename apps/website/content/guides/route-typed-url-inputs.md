---
title: "Route: make the URL an input contract"
summary: "Design shareable queue filters and issue links, decode domain parameters once, and distinguish malformed URLs from missing pages."
section: "Routing"
kind: "guide"
order: 6.7
---

A review queue starts with a list of issues. Users then ask to share their filtered list, reload a
detail page, and use Back to return to the same search. Keeping the selected issue and filters only
in component state cannot provide those behaviors: the URL needs to describe them.

A `Route` is the typed contract for one URL family. It describes path/query syntax and the codecs
that turn URL strings into handler input. It does not observe the browser, select a page, or run a
request. That separation lets the same contract serve links, browser routing, HTTP handlers, and tests.
Read the [routing overview](/explore/routing-routes-matchers-and-navigation) for how those pieces fit.

## Decide which state should survive a copied link

For this queue, the workspace identifies the collection; `q` and `status` describe filters. They
belong in the URL because a copied link should reconstruct the same search. A draft comment and
whether the user has opened a temporary menu can remain local.

```ts
import * as Router from "@typed/router"

const Queue = Router.Parse("/workspaces/:workspaceId/issues?q=:q?&status=:status?")
type QueueParams = Router.Type<typeof Queue>
// workspaceId: string; q?: string; status?: string

const queueHref = ({ workspaceId, q, status }: QueueParams) => {
  const query = new URLSearchParams()
  if (q !== undefined && q !== "") query.set("q", q)
  if (status !== undefined && status !== "all") query.set("status", status)
  const encoded = query.toString()
  return `/workspaces/${encodeURIComponent(workspaceId)}/issues${encoded ? `?${encoded}` : ""}`
}

const href = queueHref({ workspaceId: "typed", q: "render & hydrate", status: "open" })
```

The optional placeholders yield optional fields. The helper defines a canonical representation:
empty query and `all` status are omitted. Route does not infer these defaults; application code
should derive them once after decoding, then reuse that policy for links and loaders.

`URLSearchParams` handles query encoding, including characters such as `&` inside a value. Pass
unencoded values to it and avoid encoding its output a second time. Path values are encoded as
individual segments so separators remain separators. See the platform's
[URLSearchParams contract](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

This route accepts arbitrary string status values. If only `open`, `closed`, and `all` are valid,
add that vocabulary to a Schema/Guard at the input boundary. A placeholder name gives a field a
name and string shape, not a business constraint.

## Decode into the type the operation actually needs

The detail operation expects a numeric issue ID. Declare that at the Route boundary instead of
calling `Number` independently in a component, loader, and command.

```ts
import * as Router from "@typed/router"
import { Effect, Schema } from "effect"

const Issue = Router.Join(Router.Parse("/issues"), Router.Int("issueId"))
type IssueParams = Router.Type<typeof Issue>

const decodeIssue = Schema.decodeEffect(Issue.paramsSchema)
const issueHref = (params: IssueParams) =>
  Schema.encodeEffect(Issue.paramsSchema)(params).pipe(
    Effect.map(({ issueId }) => `/issues/${encodeURIComponent(issueId)}`),
  )

const example = Effect.gen(function* () {
  const decoded = yield* decodeIssue({ issueId: "42" })
  const href = yield* issueHref(decoded)
  const invalid = yield* Effect.exit(decodeIssue({ issueId: "forty-two" }))
  return { decoded, href, invalid }
})

const result = await Effect.runPromise(example)
```

The decoder receives extracted parameter records, not a whole URL. Matcher owns path lookup and
extracts those records before decoding. `SchemaError` remains in the decoder's expected-error
channel; `Effect.exit` in the example lets the test inspect an invalid input without throwing away
its Cause. Matcher reports route-selection failures with its own structured routing errors.

The codec's decoded side has a number; its encoded side supplies a string suitable for a segment.
Encoding also returns an Effect because a codec can fail or require services. Do not cast the
encoded side to a domain type or assert away `R` just to make a link helper synchronous.

`Int` rejects decimals and malformed numeric input. `Number` accepts finite decimal/exponent forms
and rejects NaN and infinity. Use `ParamWithSchema` when the operation needs a domain-specific codec,
such as a branded workspace identifier:

```ts
import * as Router from "@typed/router"
import { Schema } from "effect"

const WorkspaceId = Schema.String.pipe(Schema.brand("WorkspaceId"))
const Workspace = Router.Join(
  Router.Parse("/workspaces"),
  Router.ParamWithSchema("workspaceId", WorkspaceId),
)
const Issue = Router.Join(Workspace, Router.Parse("/issues"), Router.Int("issueId"))
type WorkspaceIssue = Router.Type<typeof Issue>
```

The brand distinguishes this identifier in TypeScript; its schema decides runtime validity. Joining
reusable fragments preserves the combined decoded shape. Duplicate decoded names are rejected at
construction: two different fragments cannot both silently claim `id`.

## Read path and query grammar without guessing

`Parse` is useful when a complete pattern is clearer than constructors. `Slash`, `Wildcard`,
`Param`, numeric constructors, and `Join` all produce the same Route interface.

| Pattern | Interpretation |
| --- | --- |
| `/issues/:issueId` | Required string path parameter |
| `/issues/:issueId?` | Optional terminal path parameter |
| `/issues/:issueId(\\d+)` | Regex-constrained string; constraint does not make it a number |
| `/files/*` | Remaining path captured as `"*"` |
| `/issues?tab=:tab?` | Optional scalar query parameter |
| `/issues?view=compact` | Required literal query constraint, not a default |
| `/issues/:issueId??tab=:tab` | Optional terminal path parameter followed by query declaration |

The double `??` boundary matters: `/issues/:issueId?tab=:tab` means required `issueId` plus query
`tab`, not optional `issueId`. Include ambiguous boundaries in route tests rather than relying on
how punctuation looks at a glance.

A repeated declared query key, such as `?status=open&status=closed`, fails route decoding instead of
silently choosing one value. Undeclared query keys are ignored by route decoding. A search feature
that intentionally supports repeated values needs an explicit representation and decoding policy;
a scalar placeholder does not become an array automatically.

## Keep validation close to the appropriate boundary

Each Route exposes `pathSchema`, `querySchema`, and `paramsSchema`. They let tooling validate path
or query records independently, while the selected handler normally receives the combined decoded
record. Use these codecs instead of maintaining parallel interfaces.

```ts
import * as Router from "@typed/router"
import { Schema } from "effect"

const Queue = Router.Parse("/workspaces/:workspaceId/issues?q=:q?&status=:status?")
const path = Schema.decodeEffect(Queue.pathSchema)({ workspaceId: "typed" })
const query = Schema.decodeEffect(Queue.querySchema)({ q: "hydration", status: "open" })
const params = Schema.decodeEffect(Queue.paramsSchema)({ workspaceId: "typed", status: "open" })
```

Syntax validation and authorization are different boundaries. A well-formed workspace ID still
needs a permission check when data is loaded or mutated. A page Guard can enrich or reject decoded
input for selection; it cannot replace authorization in the server operation itself.

Library helpers can project Route types without creating another route model. `Router.Route.Path` gives
the normalized literal pattern; `Router.Params` describes raw syntax parameters; `Router.Type` gives
the decoded handler shape; `PathType` and `QueryType` select their parts. `Router.Route.Schema`,
`DecodingServices`, and `EncodingServices` expose the codec contract for generic utilities.

`Router.make(ast)` is the extension point for code generators and routing libraries. It accepts the
public [Route AST](/reference/modules/%40typed%2Frouter%2FAST); ordinary applications usually express
the same model more clearly with Parse and Join. Type-level Path, Parser, and Uri modules underpin
literal inference and are useful when building such tooling, not prerequisites for a queue page.

## Test the URL as an external input

Test both directions. Generate a URL from decoded parameters, let Matcher select and decode it,
and assert the handler's input. Include spaces, non-ASCII text, reserved characters, missing
optional values, invalid numbers, repeated declared query keys, and duplicate decoded names.
Testing only that a link string “looks right” misses its relationship to the decoder.

When a deep link fails, inspect pathname and search separately, then the Route's normalized path and
codecs. If they are correct, investigate [Matcher candidate selection](/explore/router-navigation-live-selection).
If clicking a correct link changes history unexpectedly, investigate
[Navigation's push/replace policy](/explore/navigation-as-an-effect-service). The Route contract
should not acquire a browser listener just to diagnose either problem.

Continue with [Matcher](/explore/router-navigation-live-selection) to turn this input contract into
live page work, or the [Route reference](/reference/modules/%40typed%2Frouter%2FRoute) for the precise
constructors and type projections.
