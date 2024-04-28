---
title: Navigation.ts
nav_order: 4
parent: "@typed/navigation"
---

## Navigation overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [BeforeNavigationEvent](#beforenavigationevent)
  - [BeforeNavigationEvent (interface)](#beforenavigationevent-interface)
  - [BeforeNavigationEventJson (type alias)](#beforenavigationeventjson-type-alias)
  - [BeforeNavigationHandler (type alias)](#beforenavigationhandler-type-alias)
  - [CanGoBack](#cangoback)
  - [CanGoForward](#cangoforward)
  - [CancelNavigation (class)](#cancelnavigation-class)
  - [CurrentEntries](#currententries)
  - [CurrentEntry](#currententry)
  - [CurrentPath](#currentpath)
  - [Destination](#destination)
  - [Destination (interface)](#destination-interface)
  - [DestinationJson (type alias)](#destinationjson-type-alias)
  - [FileSchema](#fileschema)
  - [FileSchemaFrom](#fileschemafrom)
  - [FileSchemaFrom (type alias)](#fileschemafrom-type-alias)
  - [FormDataEvent](#formdataevent)
  - [FormDataEvent (interface)](#formdataevent-interface)
  - [FormDataEventJson (type alias)](#formdataeventjson-type-alias)
  - [FormDataHandler (type alias)](#formdatahandler-type-alias)
  - [FormDataSchema](#formdataschema)
  - [FormInput (interface)](#forminput-interface)
  - [FormInputFrom (type alias)](#forminputfrom-type-alias)
  - [FormInputSchema](#forminputschema)
  - [NavigateOptions (interface)](#navigateoptions-interface)
  - [Navigation](#navigation)
  - [Navigation (interface)](#navigation-interface)
  - [NavigationError (class)](#navigationerror-class)
  - [NavigationEvent](#navigationevent)
  - [NavigationEvent (interface)](#navigationevent-interface)
  - [NavigationEventJson (type alias)](#navigationeventjson-type-alias)
  - [NavigationHandler (type alias)](#navigationhandler-type-alias)
  - [NavigationType](#navigationtype)
  - [NavigationType (type alias)](#navigationtype-type-alias)
  - [ProposedDestination](#proposeddestination)
  - [ProposedDestination (interface)](#proposeddestination-interface)
  - [ProposedDestinationJson (type alias)](#proposeddestinationjson-type-alias)
  - [RedirectError (class)](#redirecterror-class)
  - [Transition](#transition)
  - [Transition (interface)](#transition-interface)
  - [TransitionJson (type alias)](#transitionjson-type-alias)
  - [back](#back)
  - [cancelNavigation](#cancelnavigation)
  - [forward](#forward)
  - [getCurrentPathFromUrl](#getcurrentpathfromurl)
  - [handleRedirect](#handleredirect)
  - [isCancelNavigation](#iscancelnavigation)
  - [isNavigationError](#isnavigationerror)
  - [isRedirectError](#isredirecterror)
  - [navigate](#navigate)
  - [onFormData](#onformdata)
  - [redirectToPath](#redirecttopath)
  - [reload](#reload)
  - [submit](#submit)
  - [traverseTo](#traverseto)
  - [updateCurrentEntry](#updatecurrententry)

---

# utils

## BeforeNavigationEvent

**Signature**

```ts
export declare const BeforeNavigationEvent: Schema.Struct<{
  type: Schema.Literal<["push", "replace", "reload", "traverse"]>
  from: Schema.Struct<{
    id: Schema.Schema<Uuid, string, never>
    key: Schema.Schema<Uuid, string, never>
    url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
    state: Schema.Unknown
    sameDocument: Schema.$Boolean
  }>
  delta: Schema.$Number
  to: Schema.Union<
    [
      Schema.Schema<
        { readonly url: URL; readonly state: unknown; readonly sameDocument: boolean },
        { readonly url: string; readonly state: unknown; readonly sameDocument: boolean },
        never
      >,
      Schema.Struct<{
        id: Schema.Schema<Uuid, string, never>
        key: Schema.Schema<Uuid, string, never>
        url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
        state: Schema.Unknown
        sameDocument: Schema.$Boolean
      }>
    ]
  >
  info: Schema.Unknown
}>
```

Added in v1.0.0

## BeforeNavigationEvent (interface)

**Signature**

```ts
export interface BeforeNavigationEvent extends Schema.Schema.Type<typeof BeforeNavigationEvent> {}
```

Added in v1.0.0

## BeforeNavigationEventJson (type alias)

**Signature**

```ts
export type BeforeNavigationEventJson = Schema.Schema.Encoded<typeof BeforeNavigationEvent>
```

Added in v1.0.0

## BeforeNavigationHandler (type alias)

**Signature**

```ts
export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent
) => Effect.Effect<
  Option.Option<Effect.Effect<unknown, RedirectError | CancelNavigation, R2>>,
  RedirectError | CancelNavigation,
  R
>
```

Added in v1.0.0

## CanGoBack

**Signature**

```ts
export declare const CanGoBack: RefSubject.Computed<boolean, never, Navigation>
```

Added in v1.0.0

## CanGoForward

**Signature**

```ts
export declare const CanGoForward: RefSubject.Computed<boolean, never, Navigation>
```

Added in v1.0.0

## CancelNavigation (class)

**Signature**

```ts
export declare class CancelNavigation
```

Added in v1.0.0

## CurrentEntries

**Signature**

```ts
export declare const CurrentEntries: RefSubject.Computed<readonly Destination[], never, Navigation>
```

Added in v1.0.0

## CurrentEntry

**Signature**

```ts
export declare const CurrentEntry: RefSubject.Computed<Destination, never, Navigation>
```

Added in v1.0.0

## CurrentPath

**Signature**

```ts
export declare const CurrentPath: RefSubject.Computed<string, never, Navigation>
```

Added in v1.0.0

## Destination

**Signature**

```ts
export declare const Destination: Schema.Struct<{
  id: Schema.Schema<Uuid, string, never>
  key: Schema.Schema<Uuid, string, never>
  url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
  state: Schema.Unknown
  sameDocument: Schema.$Boolean
}>
```

Added in v1.0.0

## Destination (interface)

**Signature**

```ts
export interface Destination extends Schema.Schema.Type<typeof Destination> {}
```

Added in v1.0.0

## DestinationJson (type alias)

**Signature**

```ts
export type DestinationJson = Schema.Schema.Encoded<typeof Destination>
```

Added in v1.0.0

## FileSchema

**Signature**

```ts
export declare const FileSchema: Schema.transformOrFail<
  Schema.Struct<{ _id: Schema.Literal<["File"]>; name: Schema.$String; data: Schema.$String }>,
  Schema.instanceOf<File>,
  never
>
```

Added in v1.0.0

## FileSchemaFrom

**Signature**

```ts
export declare const FileSchemaFrom: Schema.Struct<{
  _id: Schema.Literal<["File"]>
  name: Schema.$String
  data: Schema.$String
}>
```

Added in v1.0.0

## FileSchemaFrom (type alias)

**Signature**

```ts
export type FileSchemaFrom = Schema.Schema.Encoded<typeof FileSchemaFrom>
```

Added in v1.0.0

## FormDataEvent

**Signature**

```ts
export declare const FormDataEvent: Schema.extend<
  Schema.Struct<{
    from: Schema.Struct<{
      id: Schema.Schema<Uuid, string, never>
      key: Schema.Schema<Uuid, string, never>
      url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
      state: Schema.Unknown
      sameDocument: Schema.$Boolean
    }>
  }>,
  Schema.Struct<{
    name: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
    action: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
    method: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
    encoding: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
    data: Schema.transform<
      Schema.$Record<
        Schema.$String,
        Schema.Union<
          [
            Schema.$String,
            Schema.transformOrFail<
              Schema.Struct<{ _id: Schema.Literal<["File"]>; name: Schema.$String; data: Schema.$String }>,
              Schema.instanceOf<File>,
              never
            >
          ]
        >
      >,
      Schema.instanceOf<FormData>
    >
  }>
>
```

Added in v1.0.0

## FormDataEvent (interface)

**Signature**

```ts
export interface FormDataEvent extends Schema.Schema.Type<typeof FormDataEvent> {}
```

Added in v1.0.0

## FormDataEventJson (type alias)

**Signature**

```ts
export type FormDataEventJson = Schema.Schema.Encoded<typeof FormDataEvent>
```

Added in v1.0.0

## FormDataHandler (type alias)

**Signature**

```ts
export type FormDataHandler<R, R2> = (
  event: FormDataEvent
) => Effect.Effect<
  Option.Option<Effect.Effect<Option.Option<HttpClient.response.ClientResponse>, RedirectError | CancelNavigation, R2>>,
  RedirectError | CancelNavigation,
  R
>
```

Added in v1.0.0

## FormDataSchema

**Signature**

```ts
export declare const FormDataSchema: Schema.transform<
  Schema.$Record<
    Schema.$String,
    Schema.Union<
      [
        Schema.$String,
        Schema.transformOrFail<
          Schema.Struct<{ _id: Schema.Literal<["File"]>; name: Schema.$String; data: Schema.$String }>,
          Schema.instanceOf<File>,
          never
        >
      ]
    >
  >,
  Schema.instanceOf<FormData>
>
```

Added in v1.0.0

## FormInput (interface)

**Signature**

```ts
export interface FormInput extends Schema.Schema.Type<typeof FormInputSchema> {}
```

Added in v1.0.0

## FormInputFrom (type alias)

**Signature**

```ts
export type FormInputFrom = Schema.Schema.Encoded<typeof FormInputSchema>
```

Added in v1.0.0

## FormInputSchema

**Signature**

```ts
export declare const FormInputSchema: Schema.Struct<{
  name: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
  action: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
  method: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
  encoding: Schema.PropertySignature<":", Option.Option<string>, never, "?:", string | null | undefined, never>
  data: Schema.transform<
    Schema.$Record<
      Schema.$String,
      Schema.Union<
        [
          Schema.$String,
          Schema.transformOrFail<
            Schema.Struct<{ _id: Schema.Literal<["File"]>; name: Schema.$String; data: Schema.$String }>,
            Schema.instanceOf<File>,
            never
          >
        ]
      >
    >,
    Schema.instanceOf<FormData>
  >
}>
```

Added in v1.0.0

## NavigateOptions (interface)

**Signature**

```ts
export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}
```

Added in v1.0.0

## Navigation

**Signature**

```ts
export declare const Navigation: Tagged<Navigation, Navigation>
```

Added in v1.0.0

## Navigation (interface)

**Signature**

```ts
export interface Navigation {
  readonly origin: string

  readonly base: string

  readonly currentEntry: RefSubject.Computed<Destination>

  readonly entries: RefSubject.Computed<ReadonlyArray<Destination>>

  readonly transition: RefSubject.Computed<Option.Option<Transition>>

  readonly canGoBack: RefSubject.Computed<boolean>

  readonly canGoForward: RefSubject.Computed<boolean>

  readonly navigate: (url: string | URL, options?: NavigateOptions) => Effect.Effect<Destination, NavigationError>

  readonly back: (options?: { readonly info?: unknown }) => Effect.Effect<Destination, NavigationError>

  readonly forward: (options?: { readonly info?: unknown }) => Effect.Effect<Destination, NavigationError>

  readonly traverseTo: (
    key: Destination["key"],
    options?: { readonly info?: unknown }
  ) => Effect.Effect<Destination, NavigationError>

  readonly updateCurrentEntry: (options: { readonly state: unknown }) => Effect.Effect<Destination, NavigationError>

  readonly reload: (options?: {
    readonly info?: unknown
    readonly state?: unknown
  }) => Effect.Effect<Destination, NavigationError>

  readonly beforeNavigation: <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>

  readonly onNavigation: <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>

  readonly submit: (
    data: FormData,
    formInput?: Simplify<Omit<FormInputFrom, "data">>
  ) => Effect.Effect<
    Option.Option<HttpClient.response.ClientResponse>,
    NavigationError | HttpClient.error.HttpClientError,
    Scope.Scope | HttpClient.client.Client.Default
  >

  readonly onFormData: <R = never, R2 = never>(
    handler: FormDataHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>
}
```

Added in v1.0.0

## NavigationError (class)

**Signature**

```ts
export declare class NavigationError
```

Added in v1.0.0

## NavigationEvent

**Signature**

```ts
export declare const NavigationEvent: Schema.Struct<{
  type: Schema.Literal<["push", "replace", "reload", "traverse"]>
  destination: Schema.Struct<{
    id: Schema.Schema<Uuid, string, never>
    key: Schema.Schema<Uuid, string, never>
    url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
    state: Schema.Unknown
    sameDocument: Schema.$Boolean
  }>
  info: Schema.Unknown
}>
```

Added in v1.0.0

## NavigationEvent (interface)

**Signature**

```ts
export interface NavigationEvent extends Schema.Schema.Type<typeof NavigationEvent> {}
```

Added in v1.0.0

## NavigationEventJson (type alias)

**Signature**

```ts
export type NavigationEventJson = Schema.Schema.Encoded<typeof NavigationEvent>
```

Added in v1.0.0

## NavigationHandler (type alias)

**Signature**

```ts
export type NavigationHandler<R, R2> = (
  event: NavigationEvent
) => Effect.Effect<Option.Option<Effect.Effect<unknown, never, R2>>, never, R>
```

Added in v1.0.0

## NavigationType

**Signature**

```ts
export declare const NavigationType: Schema.Literal<["push", "replace", "reload", "traverse"]>
```

Added in v1.0.0

## NavigationType (type alias)

**Signature**

```ts
export type NavigationType = Schema.Schema.Type<typeof NavigationType>
```

Added in v1.0.0

## ProposedDestination

**Signature**

```ts
export declare const ProposedDestination: Schema.Schema<
  { readonly url: URL; readonly state: unknown; readonly sameDocument: boolean },
  { readonly url: string; readonly state: unknown; readonly sameDocument: boolean },
  never
>
```

Added in v1.0.0

## ProposedDestination (interface)

**Signature**

```ts
export interface ProposedDestination extends Schema.Schema.Type<typeof ProposedDestination> {}
```

Added in v1.0.0

## ProposedDestinationJson (type alias)

**Signature**

```ts
export type ProposedDestinationJson = Schema.Schema.Encoded<typeof ProposedDestination>
```

Added in v1.0.0

## RedirectError (class)

**Signature**

```ts
export declare class RedirectError
```

Added in v1.0.0

## Transition

**Signature**

```ts
export declare const Transition: Schema.Struct<{
  type: Schema.Literal<["push", "replace", "reload", "traverse"]>
  from: Schema.Struct<{
    id: Schema.Schema<Uuid, string, never>
    key: Schema.Schema<Uuid, string, never>
    url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
    state: Schema.Unknown
    sameDocument: Schema.$Boolean
  }>
  to: Schema.Union<
    [
      Schema.Schema<
        { readonly url: URL; readonly state: unknown; readonly sameDocument: boolean },
        { readonly url: string; readonly state: unknown; readonly sameDocument: boolean },
        never
      >,
      Schema.Struct<{
        id: Schema.Schema<Uuid, string, never>
        key: Schema.Schema<Uuid, string, never>
        url: Schema.transformOrFail<Schema.$String, Schema.instanceOf<URL>, never>
        state: Schema.Unknown
        sameDocument: Schema.$Boolean
      }>
    ]
  >
}>
```

Added in v1.0.0

## Transition (interface)

**Signature**

```ts
export interface Transition extends Schema.Schema.Type<typeof Transition> {}
```

Added in v1.0.0

## TransitionJson (type alias)

**Signature**

```ts
export type TransitionJson = Schema.Schema.Encoded<typeof Transition>
```

Added in v1.0.0

## back

**Signature**

```ts
export declare const back: (options?: {
  readonly info?: unknown
}) => Effect.Effect<Destination, NavigationError, Navigation>
```

Added in v1.0.0

## cancelNavigation

**Signature**

```ts
export declare const cancelNavigation: CancelNavigation
```

Added in v1.0.0

## forward

**Signature**

```ts
export declare const forward: (options?: {
  readonly info?: unknown
}) => Effect.Effect<Destination, NavigationError, Navigation>
```

Added in v1.0.0

## getCurrentPathFromUrl

**Signature**

```ts
export declare function getCurrentPathFromUrl(location: Pick<URL, "pathname" | "search" | "hash">): string
```

Added in v1.0.0

## handleRedirect

**Signature**

```ts
export declare function handleRedirect(error: RedirectError)
```

Added in v1.0.0

## isCancelNavigation

**Signature**

```ts
export declare function isCancelNavigation(e: unknown): e is CancelNavigation
```

Added in v1.0.0

## isNavigationError

**Signature**

```ts
export declare function isNavigationError(e: unknown): e is NavigationError
```

Added in v1.0.0

## isRedirectError

**Signature**

```ts
export declare function isRedirectError(e: unknown): e is RedirectError
```

Added in v1.0.0

## navigate

**Signature**

```ts
export declare const navigate: (
  url: string | URL,
  options?: NavigateOptions
) => Effect.Effect<Destination, NavigationError, Navigation>
```

Added in v1.0.0

## onFormData

**Signature**

```ts
export declare function onFormData<R = never, R2 = never>(
  handler: FormDataHandler<R, R2>
): Effect.Effect<void, never, Navigation | R | R2 | Scope.Scope>
```

Added in v1.0.0

## redirectToPath

**Signature**

```ts
export declare function redirectToPath(
  path: string | URL,
  options?: { readonly state?: unknown; readonly info?: unknown }
): RedirectError
```

Added in v1.0.0

## reload

**Signature**

```ts
export declare const reload: (options?: {
  readonly info?: unknown
  readonly state?: unknown
}) => Effect.Effect<Destination, NavigationError, Navigation>
```

Added in v1.0.0

## submit

**Signature**

```ts
export declare function submit(
  data: FormData,
  formInput?: Simplify<Omit<FormInputFrom, "data">>
): Effect.Effect<
  Option.Option<HttpClient.response.ClientResponse>,
  NavigationError | HttpClient.error.HttpClientError,
  Navigation | HttpClient.client.Client.Default | Scope.Scope
>
```

Added in v1.0.0

## traverseTo

**Signature**

```ts
export declare const traverseTo: (
  key: Uuid,
  options?: { readonly info?: unknown }
) => Effect.Effect<Destination, NavigationError, Navigation>
```

Added in v1.0.0

## updateCurrentEntry

**Signature**

```ts
export declare const updateCurrentEntry: (options: {
  readonly state: unknown
}) => Effect.Effect<Destination, NavigationError, Navigation>
```

Added in v1.0.0
