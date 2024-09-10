import { HttpApiEndpoint as PlatformHttpApiEndpoint } from "@effect/platform"
import type { HttpMethod } from "@effect/platform/HttpMethod"
import type { PathInput } from "@effect/platform/HttpRouter"
import type { Schema } from "@effect/schema"
import { Route } from "@typed/core"
import * as MatchInput from "@typed/router/MatchInput"
import type { Context, Option } from "effect"
import { dual, pipe } from "effect/Function"
import type { CurrentParams } from "./HttpRouteHandler"

export interface HttpApiEndpoint<
  Name extends string,
  Method extends HttpMethod,
  Route extends MatchInput.MatchInput.Any,
  Payload = never,
  Headers = never,
  Success = void,
  Error = never,
  R = never
> extends
  PlatformHttpApiEndpoint.HttpApiEndpoint<
    Name,
    Method,
    MatchInput.MatchInput.Schema<Route>,
    Payload,
    Headers,
    Success,
    Error,
    Exclude<R, CurrentParams<Route>>
  >
{
  readonly route: Route
}

export namespace HttpApiEndpoint {
  export interface Any extends PlatformHttpApiEndpoint.HttpApiEndpoint.All {
    readonly route: MatchInput.MatchInput.Any
  }

  export type Success<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Success<Endpoint>

  export type Error<Endpoint extends Any> =
    | PlatformHttpApiEndpoint.HttpApiEndpoint.Error<Endpoint>
    | MatchInput.MatchInput.Error<Endpoint["route"]>

  export type PathParsed<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.PathParsed<Endpoint>

  export type Payload<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Payload<Endpoint>

  export type Headers<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Headers<Endpoint>

  export type Request<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Request<Endpoint>

  export type Context<Endpoint extends Any> =
    | PlatformHttpApiEndpoint.HttpApiEndpoint.Context<Endpoint>
    | MatchInput.MatchInput.Context<Endpoint["route"]>

  export type ClientRequest<Path, Payload, Headers> = PlatformHttpApiEndpoint.HttpApiEndpoint.ClientRequest<
    Path,
    Payload,
    Headers
  >

  export type Handler<Endpoint extends Any, E, R> = PlatformHttpApiEndpoint.HttpApiEndpoint.Handler<Endpoint, E, R>

  export type HandlerRedacted<Endpoint extends Any, E, R> = PlatformHttpApiEndpoint.HttpApiEndpoint.HandlerRedacted<
    Endpoint,
    E,
    R
  >

  export type HandlerResponse<Endpoint extends Any, E, R> = PlatformHttpApiEndpoint.HttpApiEndpoint.HandlerResponse<
    Endpoint,
    E,
    R
  >

  export type WithPrefix<Prefix extends MatchInput.MatchInput.Any, Endpoint extends Any> = Endpoint extends
    HttpApiEndpoint<
      infer Name,
      infer Method,
      infer Route,
      infer Headers,
      infer Payload,
      infer Success,
      infer Error,
      infer Context
    > ? HttpApiEndpoint<
      Name,
      Method,
      MatchInput.MatchInput.Concat<Prefix, Route>,
      Headers,
      Payload,
      Success,
      Error,
      Context
    > :
    never
}

export const isTypedHttpApiEndpoint = (u: any): u is HttpApiEndpoint.Any =>
  PlatformHttpApiEndpoint.isHttpApiEndpoint(u) && "route" in u

export const make =
  <Method extends HttpMethod>(method: Method) =>
  <const Name extends string, R extends MatchInput.MatchInput.Any>(
    name: Name,
    route: R
  ): HttpApiEndpoint<Name, Method, R> =>
    Object.assign(PlatformHttpApiEndpoint.make(method)(name, MatchInput.getPath(route) as PathInput), { route }) as any

export const get: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "GET", R> = make("GET")

export const post: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "POST", R> = make("POST")

export const put: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "PUT", R> = make("PUT")

export const patch: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "PATCH", R> = make("PATCH")

export const del: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "DELETE", R> = make("DELETE")

export const options: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "OPTIONS", R> = make("OPTIONS")

export const head: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "HEAD", R> = make("HEAD")

/**
 * Set the schema for the success response of the endpoint. The status code
 * will be inferred from the schema, otherwise it will default to 200.
 *
 * @since 1.0.0
 * @category result
 */
export const setSuccess: {
  <S extends Schema.Schema.Any>(
    schema: S,
    annotations?: {
      readonly status?: number | undefined
    }
  ): <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, _H, Schema.Schema.Type<S>, _E, _R | Schema.Schema.Context<S>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    S extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: S,
    annotations?: {
      readonly status?: number | undefined
    }
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, Schema.Schema.Type<S>, _E, _R | Schema.Schema.Context<S>>
} = dual(
  (args) => isTypedHttpApiEndpoint(args[0]),
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    S extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: S,
    annotations?: {
      readonly status?: number | undefined
    }
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, Schema.Schema.Type<S>, _E, _R | Schema.Schema.Context<S>> =>
    pipe(
      self,
      PlatformHttpApiEndpoint.setSuccess(schema, annotations),
      (x) => Object.assign(x, { route: self.route }) as any
    )
)

export const addError: {
  <E extends Schema.Schema.All>(
    schema: E,
    annotations?: {
      readonly status?: number | undefined
    }
  ): <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E | Schema.Schema.Type<E>, _R | Schema.Schema.Context<E>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    E extends Schema.Schema.All
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: E,
    annotations?: {
      readonly status?: number | undefined
    }
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E | Schema.Schema.Type<E>, _R | Schema.Schema.Context<E>>
} = dual(
  (args) => PlatformHttpApiEndpoint.isHttpApiEndpoint(args[0]),
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    E extends Schema.Schema.All
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: E,
    annotations?: {
      readonly status?: number | undefined
    }
  ): HttpApiEndpoint<
    Name,
    Method,
    _Route,
    _P,
    _H,
    _S,
    _E | Schema.Schema.Type<E>,
    _R | Schema.Schema.Context<E>
  > =>
    pipe(
      self,
      PlatformHttpApiEndpoint.addError(schema, annotations),
      (x) => Object.assign(x, { route: self.route }) as any
    )
)

/**
 * Set the schema for the request body of the endpoint. The schema will be
 * used to validate the request body before the handler is called.
 *
 * For endpoints with no request body, the payload will use the url search
 * parameters.
 *
 * You can set a multipart schema to handle file uploads by using the
 * `HttpApiSchema.Multipart` combinator.
 *
 * @since 1.0.0
 * @category request
 */
export const setPayload: {
  <Method extends HttpMethod, P extends Schema.Schema.All>(
    schema: P & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePayload<Method, P>
  ): <
    Name extends string,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, Schema.Schema.Type<P>, _H, _S, _E, _R | Schema.Schema.Context<P>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    P extends Schema.Schema.All
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: P & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePayload<Method, P>
  ): HttpApiEndpoint<Name, Method, _Route, Schema.Schema.Type<P>, _H, _S, _E, _R | Schema.Schema.Context<P>>
} = dual(
  2,
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    P extends Schema.Schema.All
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: P & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePayload<Method, P>
  ): HttpApiEndpoint<Name, Method, _Route, Schema.Schema.Type<P>, _H, _S, _E, _R | Schema.Schema.Context<P>> =>
    pipe(
      self,
      PlatformHttpApiEndpoint.setPayload(schema),
      (x) => Object.assign(x, { route: self.route }) as any
    )
)

/**
 * Set the schema for the path parameters of the endpoint. The schema will be
 * used to validate the path parameters before the handler is called.
 *
 * @since 1.0.0
 * @category request
 */
export const setPath: {
  <Path extends Schema.Schema.Any>(
    schema: Path & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePath<Path>
  ): <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R | Schema.Schema.Context<Path>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    Path extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: Path & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePath<Path>
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R | Schema.Schema.Context<Path>>
} = dual(
  2,
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    Path extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: Path & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePath<Path>
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R | Schema.Schema.Context<Path>> =>
    pipe(
      self,
      PlatformHttpApiEndpoint.setPath(schema),
      (x) => Object.assign(x, { route: self.route }) as any
    )
)

/**
 * Set the schema for the headers of the endpoint. The schema will be
 * used to validate the headers before the handler is called.
 *
 * @since 1.0.0
 * @category request
 */
export const setHeaders: {
  <Method extends HttpMethod, H extends Schema.Schema.Any>(
    schema: H & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidateHeaders<H>
  ): <
    Name extends string,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, Schema.Schema.Type<H>, _S, _E, _R | Schema.Schema.Context<H>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    H extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: H & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidateHeaders<H>
  ): HttpApiEndpoint<Name, Method, _Route, _P, Schema.Schema.Type<H>, _S, _E, _R | Schema.Schema.Context<H>>
} = dual(
  2,
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    H extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: H & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidateHeaders<H>
  ): HttpApiEndpoint<Name, Method, _Route, _P, Schema.Schema.Type<H>, _S, _E, _R | Schema.Schema.Context<H>> =>
    pipe(
      self,
      PlatformHttpApiEndpoint.setHeaders(schema),
      (x) => Object.assign(x, { route: self.route }) as any
    )
)

/**
 * Add a prefix to the path of the endpoint.
 *
 * @since 1.0.0
 * @category request
 */
export const prefix: {
  <Prefix extends MatchInput.MatchInput.Any>(
    prefix: Prefix
  ): <A extends HttpApiEndpoint.Any>(
    self: A
  ) => HttpApiEndpoint.WithPrefix<Prefix, A>
  <A extends HttpApiEndpoint.Any, Prefix extends MatchInput.MatchInput.Any>(
    self: A,
    prefix: Prefix
  ): HttpApiEndpoint.WithPrefix<Prefix, A>
} = dual(
  2,
  <A extends HttpApiEndpoint.Any, Prefix extends MatchInput.MatchInput.Any>(
    self: A,
    prefix: Prefix
  ): HttpApiEndpoint.WithPrefix<Prefix, A> =>
    pipe(
      self,
      PlatformHttpApiEndpoint.prefix(MatchInput.getPath(prefix) as PathInput),
      (x) => Object.assign(x, { route: MatchInput.concat(prefix, self.route) }) as any
    )
)

const foo = Route.parse("/foo")
const bar = Route.parse("/:bar")

export const endpoint = get("bar", bar).pipe(prefix(foo))

/**
 * @since 1.0.0
 * @category reflection
 */
export const schemaSuccess = <A extends HttpApiEndpoint.Any>(
  self: A
): Option.Option<
  Schema.Schema<PlatformHttpApiEndpoint.HttpApiEndpoint.Success<A>, unknown, HttpApiEndpoint.Context<A>>
> => PlatformHttpApiEndpoint.schemaSuccess(self)

/**
 * Merge the annotations of the endpoint with the provided context.
 *
 * @since 1.0.0
 * @category annotations
 */
export const annotateMerge: {
  <I>(
    context: Context.Context<I>
  ): <A extends HttpApiEndpoint.Any>(self: A) => A
  <A extends HttpApiEndpoint.Any, I>(self: A, context: Context.Context<I>): A
} = dual(
  2,
  <A extends HttpApiEndpoint.Any, I>(
    self: A,
    context: Context.Context<I>
  ): A =>
    pipe(
      self,
      PlatformHttpApiEndpoint.annotateMerge(context),
      (x) => Object.assign(x, { route: self.route }) as A
    )
)

/**
 * Add an annotation to the endpoint.
 *
 * @since 1.0.0
 * @category annotations
 */
export const annotate: {
  <I, S>(
    tag: Context.Tag<I, S>,
    value: S
  ): <A extends HttpApiEndpoint.Any>(self: A) => A
  <A extends HttpApiEndpoint.Any, I, S>(
    self: A,
    tag: Context.Tag<I, S>,
    value: S
  ): A
} = dual(
  3,
  <A extends HttpApiEndpoint.Any, I, S>(
    self: A,
    tag: Context.Tag<I, S>,
    value: S
  ): A =>
    pipe(
      self,
      PlatformHttpApiEndpoint.annotate(tag, value),
      (x) => Object.assign(x, { route: self.route }) as A
    )
)
