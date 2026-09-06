/**
 * Schema-bound native controls, decoded values, field errors, and submit lifetime.
 * Start with make for application forms; explicit-state controls support library boundaries.
 * Browser FormData conversion and structured input codecs are separate APIs.
 *
 * Read the [Form guide](/explore/ui-form) for a complete example.
 *
 * [Platform reference](https://html.spec.whatwg.org/multipage/forms.html#the-form-element).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";
import * as SchemaTransformation from "effect/SchemaTransformation";
import type * as SchemaAST from "effect/SchemaAST";
import { Fx as FxApi, RefSubject, Subject } from "@typed/fx";
import * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Metadata updated after a successful field mutation.
 *
 * @remarks
 * dirty compares the new field value with defaultValues using !==, so object and array
 * comparisons are by identity. touched becomes true for both user and programmatic updates; it
 * is not specifically a blur flag.
 * @since 1.0.0
 * @category State models
 */
export interface FieldMeta {
  /**
   * Whether the updated value differs from its default under !== comparison.
   */
  readonly dirty: boolean;
  /**
   * Whether user or programmatic field mutation has occurred.
   */
  readonly touched: boolean;
}

/**
 * Serializable renderer-independent state of a form.
 *
 * @remarks
 * Values, defaults, validation messages, interaction metadata, and submission
 * state can be inspected and tested without rendering a component.
 *
 * A `FormState` RefSubject owns this value. Renderers subscribe to it; they do
 * not contain or become the source of truth.
 * @since 1.0.0
 * @category State models
 */
export interface State<Values extends object = object> {
  /**
   * Current decoded field values.
   */
  readonly values: Values;
  /**
   * Exact baseline reference used by reset and retained independently from current values.
   */
  readonly defaultValues: Values;
  /**
   * Current validation messages keyed by field name.
   */
  readonly errors: Partial<Record<keyof Values & string, string>>;
  /**
   * Dirty/touched metadata keyed by field name.
   */
  readonly meta: Partial<Record<keyof Values & string, FieldMeta>>;
  /**
   * Whether validation or the returned submit Effect is running.
   */
  readonly submitting: boolean;
}

/**
 * Input used to construct a hydrated form state.
 *
 * @remarks
 * Defaults make the common case concise while allowing SSR callers to provide
 * deterministic identity and server-known validation state.
 *
 * `values` and an explicit `defaultValues` are retained by reference, including
 * their nested objects. When `defaultValues` is omitted, both state fields
 * initially reference the exact `values` object. Subsequent helpers replace the
 * top-level `values` record but do not deep-clone nested values.
 * @since 1.0.0
 * @category State models
 */
export interface InitialState<Values extends object> {
  /**
   * Stable relationship/hydration id; provide it for deterministic SSR.
   */
  readonly id?: string;
  /**
   * Initial decoded values.
   */
  readonly values: Values;
  /**
   * Exact reset-baseline reference; defaults to the same object as `values`.
   */
  readonly defaultValues?: Values;
  /**
   * Optional initial validation messages.
   */
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  /**
   * Optional initial field metadata.
   */
  readonly meta?: Partial<Record<keyof Values & string, FieldMeta>>;
  /**
   * Whether validation or the returned submit Effect is running.
   */
  readonly submitting?: boolean;
}

/**
 * Hydrated RefSubject carrying form state plus runtime schema metadata.
 *
 * @remarks
 * State is serializable across SSR while codecs and field validators stay as
 * runtime capabilities. This keeps validation type-safe without trying to
 * serialize executable schemas.
 *
 * The surrounding Effect Scope owns the hydrated RefSubject and its subscribers.
 * On the server, serializable state is emitted for hydration; on the client it
 * must be restored before mounted controls begin producing updates.
 * @since 1.0.0
 * @category State models
 */
export type FormState<Values extends object> = RefSubject.HydratedRefSubject<
  State<Values>,
  Schema.SchemaError
> & {
  /**
   * Runtime identity used to scope field/error relationships. Pass an id for deterministic SSR.
   */
  readonly id: string;
  /**
   * Runtime-only validation codec; it is deliberately absent from hydration state.
   */
  readonly codec: Schema.Codec<Values, unknown>;
  /**
   * Runtime field codecs used for field-level validation.
   */
  readonly fields: Readonly<Record<keyof Values & string, Schema.Codec<any, any>>>;
};

let nextFormId = 0;

/**
 * Context service exposed to schema-bound descendant controls.
 *
 * @remarks
 * A bound form can share its state through Effect context without a component tree.
 *
 * The root form provides the service only for its rendered Fx lifetime; it does
 * not own the underlying state beyond that state's Scope.
 * @since 1.0.0
 * @category Form context
 */
export interface FormService<Values extends object> {
  /**
   * Form state visible to bound descendants.
   */
  readonly state: FormState<Values>;
}

/**
 * Effect context service used by schema-bound form controls.
 *
 * @remarks
 * Bound controls avoid threading `state` through every call while their
 * service requirement remains visible in the Fx type.
 *
 * `Form` provides the service for its child render lifetime; use outside that
 * boundary fails with the ordinary Effect missing-service defect.
 * @since 1.0.0
 * @category Form context
 */
export const CurrentForm = Context.Service<FormService<any>>("@typed/ui/Form/CurrentForm");

function withCurrentForm<Values extends object>() {
  return <Result extends Fx.Any>(f: (state: FormState<Values>) => Result) =>
    FxApi.gen(function* () {
      const current = yield* CurrentForm;
      return f(current.state as FormState<Values>);
    });
}

const FieldMetaSchema = Schema.Struct({
  dirty: Schema.Boolean,
  touched: Schema.Boolean,
});

/**
 * Schema field map accepted by the schema-bound form factory.
 *
 * @remarks
 * A Struct's individual codecs drive field-name inference and field-level decoding.
 *
 * Codecs are runtime values retained by the created form API; they are not hydrated.
 * @since 1.0.0
 * @category State models
 */
export type FormFields = Readonly<Record<string, Schema.Codec<any, any>>>;
type OptionalFields<Fields extends FormFields, Value extends Schema.Constraint> = {
  readonly [Key in keyof Fields]: Schema.optionalKey<Value>;
};
type InitialStateFor<Fields extends FormFields> = {
  readonly id?: string;
  readonly values: Schema.Struct.Type<Fields>;
  readonly defaultValues?: Schema.Struct.Type<Fields>;
  readonly errors?: Schema.Struct.Type<OptionalFields<Fields, typeof Schema.String>>;
  readonly meta?: Schema.Struct.Type<OptionalFields<Fields, typeof FieldMetaSchema>>;
  readonly submitting?: boolean;
};

function optionalFields<Fields extends FormFields, Value extends Schema.Constraint>(
  fields: Fields,
  value: Value,
): OptionalFields<Fields, Value> {
  return Object.fromEntries(
    Object.keys(fields).map((key) => [key, Schema.optionalKey(value)]),
  ) as OptionalFields<Fields, Value>;
}

function emptyOptionalFields<Fields extends FormFields, Value extends Schema.Constraint>() {
  return {} as Schema.Struct.Type<OptionalFields<Fields, Value>>;
}

/**
 * Builds the serializable schema for a form's hydrated state.
 *
 * @remarks
 * The hydration payload needs validation independent from runtime-only field codecs.
 *
 * Pure schema construction; the returned Schema acquires no Scope or subscription.
 *
 * @example
 * ```ts
 * import { StateSchema } from "@typed/ui/Form"
 * import { Schema } from "effect"
 *
 * const codec = Schema.Struct({ email: Schema.String })
 * const stateCodec = StateSchema(codec)
 * ```
 * @since 1.0.0
 * @category Hydration schemas
 */
export function StateSchema<const Fields extends FormFields>(codec: Schema.Struct<Fields>) {
  return Schema.Struct({
    values: codec,
    defaultValues: codec,
    errors: Schema.Struct(optionalFields(codec.fields, Schema.String)),
    meta: Schema.Struct(optionalFields(codec.fields, FieldMetaSchema)),
    submitting: Schema.Boolean,
  });
}
/**
 * Creates a Scope-owned hydrated form RefSubject from a Struct codec.
 *
 * @remarks
 * One constructor establishes values, defaults, validation state, field codecs,
 * and hydration identity consistently.
 *
 * Requires `Scope.Scope`. Provide an explicit `id` during SSR; the counter-based
 * fallback is process/order dependent. Only state data hydrates—`codec` and
 * `fields` are reattached from the live Struct on each runtime.
 *
 * @example
 * ```ts
 * import { makeState } from "@typed/ui/Form"
 * import { Effect, Schema } from "effect"
 *
 * const codec = Schema.Struct({ email: Schema.String })
 * const program = Effect.gen(function* () {
 *   const state = yield* makeState(codec, { id: "signup", values: { email: "" } })
 *   return state
 * })
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState<const Fields extends FormFields>(
  codec: Schema.Struct<Fields>,
  initial: InitialStateFor<Fields>,
) {
  const id = initial.id ?? `typed-form-${++nextFormId}`;
  return Effect.map(
    RefSubject.hydrate(StateSchema(codec), {
      values: initial.values,
      defaultValues: initial.defaultValues ?? initial.values,
      errors: initial.errors ?? emptyOptionalFields<Fields, typeof Schema.String>(),
      meta: initial.meta ?? emptyOptionalFields<Fields, typeof FieldMetaSchema>(),
      submitting: initial.submitting ?? false,
    }),
    (state) => Object.assign(state, { codec, fields: codec.fields, id }),
  );
}

/**
 * Field names whose decoded value is assignable to `Value`.
 *
 * @remarks
 * Control options reject incompatible fields at compile time.
 * @since 1.0.0
 * @category Field types
 */
export type FieldNameFor<Values extends object, Value> = {
  [Key in keyof Values & string]: Values[Key] extends Value ? Key : never;
}[keyof Values & string];

/**
 * Struct field names matching both decoded and encoded control value types.
 *
 * @remarks
 * Schema-bound controls require an encoded form compatible with the native element.
 * @since 1.0.0
 * @category Field types
 */
export type SchemaFieldNameFor<Fields extends FormFields, Value, Encoded> = {
  [Key in keyof Fields & string]: Fields[Key]["Type"] extends Value
    ? Fields[Key]["Encoded"] extends Encoded
      ? Key
      : never
    : never;
}[keyof Fields & string];

/**
 * State-explicit native input binding with a compatible field name and optional string codec.
 *
 * @remarks
 * Successful native input decoding updates values and metadata; failure records an error while
 * retaining the last decoded value. Rendering encodes the retained value into .value, so
 * arbitrary invalid draft text is not guaranteed to remain visible. Native constraints and codec
 * validation are separate boundaries.
 * @since 1.0.0
 * @category Component options
 */
export interface InputOptions<
  Values extends object,
  Value,
> extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Renderer-independent form state to read and update.
   */
  readonly state: FormState<Values>;
  /**
   * Type-compatible field name.
   */
  readonly name: FieldNameFor<Values, Value>;
  /**
   * Optional string codec overriding the input type's default codec.
   */
  readonly codec?: Schema.Codec<Value, string>;
}

/**
 * String-valued native input options.
 * @remarks
 * Names are restricted to fields a text-like control can represent without an incompatible cast.
 * The control Scope owns DOM work; the referenced state and optional codec are borrowed.
 * @since 1.0.0
 * @category Component options
 */
export type TextInputOptions<Values extends object> = InputOptions<Values, string>;
/**
 * Finite-number native input options.
 * @remarks
 * Names are restricted to numeric fields compatible with number/range decoding.
 * The control Scope owns DOM work; the referenced state and optional codec are borrowed.
 * @since 1.0.0
 * @category Component options
 */
export type NumberInputOptions<Values extends object> = InputOptions<Values, number>;
/**
 * Date-valued native input options.
 * @remarks
 * Names are restricted to Date fields compatible with native date-string decoding.
 * The control Scope owns DOM work; the referenced state and optional codec are borrowed.
 * @since 1.0.0
 * @category Component options
 */
export type DateInputOptions<Values extends object> = InputOptions<Values, Date>;

function setFieldError<Values extends object, Key extends keyof Values & string, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  key: Key,
  error: string | undefined,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const errors = { ...current.errors };
    if (error === undefined) delete errors[key];
    else errors[key] = error;
    return { ...current, errors };
  });
}

function fieldErrorId<Values extends object>(
  state: FormState<Values>,
  name: keyof Values & string,
): string {
  return `${state.id}-${encodeURIComponent(name)}-error`;
}

function decodeField<Values extends object, Value>(
  state: FormState<Values>,
  name: FieldNameFor<Values, Value>,
  codec: Schema.Codec<Value, string>,
  value: string,
): Effect.Effect<State<Values>, Schema.SchemaError, never> {
  return Schema.decodeEffect(codec)(value).pipe(
    Effect.flatMap((decoded) =>
      Effect.andThen(updateDecodedValue(state, name, decoded), () =>
        setFieldError(state, name, undefined),
      ),
    ),
    Effect.catch((error) => setFieldError(state, name, error.message)),
  );
}

function decodeUpdatedField<Values extends object, Key extends keyof Values & string>(
  state: FormState<Values>,
  name: Key,
  encoded: unknown,
): Effect.Effect<State<Values>, Schema.SchemaError> {
  return Schema.decodeUnknownEffect(state.fields[name])(encoded).pipe(
    Effect.flatMap((decoded) =>
      Effect.andThen(updateDecodedValue(state, name, decoded as Values[Key]), () =>
        setFieldError(state, name, undefined),
      ),
    ),
    Effect.catch((error) => setFieldError(state, name, error.message)),
  );
}

function inputProps<Values extends object, Value>(
  options: InputOptions<Values, Value>,
  type: string,
  codec: Schema.Codec<Value, string>,
) {
  const parts = maskParts.get(codec);
  if (parts !== undefined) return maskedInputProps(options, type, codec, parts);
  return () =>
    ({
      type,
      name: options.name,
      "aria-describedby": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined
          ? undefined
          : fieldErrorId(options.state, options.name),
      ),
      "aria-invalid": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined ? undefined : true,
      ),
      ".value": RefSubject.mapEffect(options.state, (state) =>
        Schema.encodeUnknownEffect(codec)(state.values[options.name]),
      ),
      oninput: EventHandler.make(
        Effect.fn((event: Event) =>
          decodeField(
            options.state,
            options.name,
            codec,
            Dom.currentTarget<HTMLInputElement>(event).value,
          ),
        ),
      ),
    }) as const;
}

type InputProps<Values extends object, Value> = ReturnType<
  ReturnType<typeof inputProps<Values, Value>>
>;

type RenderableComponentOptions<Options> = Pick<
  Options,
  Extract<keyof Options, "props" | "ref" | "content" | Dom.EventHandlerProperty>
>;

/**
 * Options for a schema-bound native input.
 *
 * @remarks
 * The factory's Struct infers compatible field names, so callers need not pass state or a codec.
 *
 * State is borrowed from `CurrentForm`; the control's Scope owns its DOM subscription.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundInputOptions<
  Fields extends FormFields,
  Value,
> extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Struct field whose decoded type matches `Value` and whose encoded type is string.
   */
  readonly name: SchemaFieldNameFor<Fields, Value, string>;
}

/**
 * Options for a schema-bound masked text input.
 *
 * @remarks
 * Any field with a string encoding can use the Struct field codec as its mask codec.
 *
 * State is borrowed from `CurrentForm`; the control Scope owns DOM work.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundMaskedInputOptions<
  Fields extends FormFields,
> extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Struct field whose codec accepts the input's string representation.
   */
  readonly name: SchemaFieldNameFor<Fields, unknown, string>;
}

/**
 * Options for a schema-bound boolean checkbox.
 *
 * @remarks
 * Field-name inference limits the native checked binding to boolean fields.
 *
 * State is borrowed from `CurrentForm`; the control Scope owns DOM work.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundCheckboxOptions<
  Values extends object,
> extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Boolean field controlled by the checkbox.
   */
  readonly name: BooleanFieldName<Values>;
}

/**
 * Options for a schema-bound native select.
 *
 * @remarks
 * Native option markup remains caller-authored while selection binds to a string field.
 *
 * State is borrowed from `CurrentForm`; rendered content is owned by the control Scope.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundSelectOptions<
  Values extends object,
> extends Dom.HostOptions<HTMLSelectElement> {
  /**
   * String field controlled by the select.
   */
  readonly name: FieldNameFor<Values, string>;
  /**
   * Native option/optgroup renderable content.
   */
  readonly content: Renderable.Any;
}

/**
 * Options for a schema-bound field-error region.
 *
 * @remarks
 * Error text and ARIA relationships derive from the same form identity and field name.
 *
 * State is borrowed from `CurrentForm`; the error host Scope owns its subscription.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundErrorOptions<
  Values extends object,
> extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Field whose current validation message is rendered.
   */
  readonly name: keyof Values & string;
}

/**
 * Options for a schema-bound reset button.
 *
 * @remarks
 * The button can use native semantics without receiving state explicitly.
 *
 * State is borrowed from `CurrentForm`; button content is Scope-owned renderable work.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundResetOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Reset button label/content.
   */
  readonly content: Renderable.Any;
}

/**
 * Options for a schema-bound array append button.
 *
 * @remarks
 * Array field and element types are inferred from the form schema.
 *
 * State is borrowed from `CurrentForm`; the click Effect and content share the host Scope.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundPushOptions<
  Values extends object,
  Name extends ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Array-valued field to append to.
   */
  readonly name: Name;
  /**
   * Type-compatible item appended on activation.
   */
  readonly value: ArrayFieldValue<Values, Name>;
  /**
   * Button label/content.
   */
  readonly content: Renderable.Any;
}

/**
 * Options for a schema-bound array removal button.
 *
 * @remarks
 * The field is constrained to arrays and the index remains an explicit local operation.
 *
 * State is borrowed from `CurrentForm`; the click Effect and content share the host Scope.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundRemoveOptions<
  Values extends object,
  Name extends ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Array-valued field to remove from.
   */
  readonly name: Name;
  /**
   * Zero-based item index removed on activation.
   */
  readonly index: number;
  /**
   * Button label/content.
   */
  readonly content: Renderable.Any;
}

function renderInput<
  const Values extends object,
  Value,
  const Options extends InputOptions<Values, Value>,
  const Host extends HostResult = never,
>(
  options: Options,
  host:
    | Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Values, Value>>, "", Host>
    | undefined,
  type: string,
  defaultCodec: Schema.Codec<Value, string>,
): Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableComponentOptions<Options> | Host>,
  Renderable.Services<RenderableComponentOptions<Options> | Host> | Scope.Scope | RenderTemplate
> {
  const codec = options.codec ?? defaultCodec;
  return FxApi.suspend(() =>
    Dom.renderHost<HTMLInputElement>()<Options, InputProps<Values, Value>, "", HostResult, Host>(
      options,
      host,
      inputProps(options, type, codec),
      "",
      (props) => html`<input ...${props} />`,
    ),
  ) as Fx<
    RenderEvent,
    Schema.SchemaError | Renderable.Error<RenderableComponentOptions<Options> | Host>,
    Renderable.Services<RenderableComponentOptions<Options> | Host> | Scope.Scope | RenderTemplate
  >;
}

/**
 * Public component contract shared by state-explicit native input factories.
 *
 * @remarks
 * Text-like, numeric, range, and date controls differ in their default codec while preserving one
 * field-inference, host-override, error, and service contract. Naming that contract keeps emitted
 * declarations readable without hiding any generic channel behind a private compiler alias.
 *
 * Calling an input component starts no work. The returned Fx requires the Scope and RenderTemplate
 * that own DOM rendering; the supplied FormState remains independently owned and may outlive it.
 *
 * @example
 * ```ts
 * import { InputComponent, makeState, TextInput } from "@typed/ui/Form"
 * import { html } from "@typed/template"
 * import { Effect, Schema } from "effect"
 *
 * const Text: InputComponent<string> = TextInput
 * const rendered = Effect.gen(function* () {
 *   const state = yield* makeState(Schema.Struct({ name: Schema.String }), {
 *     values: { name: "" }
 *   })
 *   return Text({ state, name: "name" }, (props) => html`<input ...${props} />`)
 * })
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export type InputComponent<Value> = <
  const Values extends object,
  const Options extends InputOptions<Values, Value>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<InputOptions<Values, Value>, "state" | "name">,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Values, Value>>, "", Host>,
) => Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableComponentOptions<Options> | Host>,
  Renderable.Services<RenderableComponentOptions<Options> | Host> | Scope.Scope | RenderTemplate
>;

function makeInput<Value>(type: string, codec: Schema.Codec<Value, string>): InputComponent<Value> {
  return function <
    const Values extends object,
    const Options extends InputOptions<Values, Value>,
    const Host extends HostResult = never,
  >(
    options: Options & Pick<InputOptions<Values, Value>, "state" | "name">,
    host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputProps<Values, Value>>, "", Host>,
  ) {
    return renderInput(options, host, type, codec);
  };
}

function makeSchemaBoundInput<Fields extends FormFields, Value>(
  formCodec: Schema.Struct<Fields>,
  type: string,
) {
  type Values = Schema.Struct.Type<Fields>;
  return function <
    const Options extends SchemaBoundInputOptions<Fields, Value>,
    const Host extends HostResult = never,
  >(options: Options, host?: Dom.HostOverride<Dom.HostProps<HTMLInputElement>, "", Host>) {
    return withCurrentForm<Values>()((state) => {
      type RenderOptions = Omit<Options, "name"> & InputOptions<Values, Value>;
      const inputOptions = { ...options, state } as unknown as RenderOptions;
      const fieldCodec = formCodec.fields[options.name] as unknown as Schema.Codec<Value, string>;
      return renderInput<Values, Value, RenderOptions, Host>(
        inputOptions,
        host as never,
        type,
        fieldCodec,
      );
    });
  };
}

/**
 * Binds a native `input[type=text]` to a string field.
 *
 * @remarks
 * The control uses the browser's real input event and a Schema codec while
 * keeping state independently testable.
 *
 * The control Scope owns DOM listeners/subscriptions; the supplied `FormState`
 * may outlive the rendered input. A custom host must apply all merged props.
 *
 * @example
 * ```ts
 * import { TextInput, makeState } from "@typed/ui/Form"
 * import { Effect, Schema } from "effect"
 *
 * const codec = Schema.Struct({ name: Schema.String })
 * const input = Effect.gen(function* () {
 *   const state = yield* makeState(codec, { values: { name: "" } })
 *   return TextInput({ state, name: "name" })
 * })
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export const TextInput = makeInput("text", Schema.String);
/**
 * Binds a native search input to a string field.
 * @remarks
 * Preserves the platform's search-input semantics while sharing Typed validation.
 * @since 1.0.0
 * @category Native controls
 */
export const SearchInput = makeInput("search", Schema.String);
/**
 * Binds a native email input to a string field.
 * @remarks
 * Keeps browser email affordances and constraints available alongside Schema validation.
 * @since 1.0.0
 * @category Native controls
 */
export const EmailInput = makeInput("email", Schema.String);
/**
 * Binds a native URL input to a string field.
 * @remarks
 * Keeps browser URL affordances while the schema remains the decoded state contract.
 * @since 1.0.0
 * @category Native controls
 */
export const UrlInput = makeInput("url", Schema.String);
/**
 * Binds a native telephone input to a string field.
 * @remarks
 * Preserves platform telephone keyboards and autocomplete behavior.
 * @since 1.0.0
 * @category Native controls
 */
export const TelInput = makeInput("tel", Schema.String);
/**
 * Binds a native password input to a string field.
 * @remarks
 * Uses browser password handling instead of recreating sensitive-input behavior.
 * @since 1.0.0
 * @category Native controls
 */
export const PasswordInput = makeInput("password", Schema.String);
/**
 * Binds a native hidden input to a string field.
 * @remarks
 * Allows standards-based form serialization for non-visible values.
 * @since 1.0.0
 * @category Native controls
 */
export const HiddenInput = makeInput("hidden", Schema.String);
/**
 * Binds a native color input to a string field.
 * @remarks
 * Retains the browser's color picker while state receives its string value.
 * @since 1.0.0
 * @category Native controls
 */
export const ColorInput = makeInput("color", Schema.String);
/**
 * Binds a native time input to a string field.
 * @remarks
 * Preserves browser locale and time-entry behavior without inventing a picker.
 * @since 1.0.0
 * @category Native controls
 */
export const TimeInput = makeInput("time", Schema.String);
/**
 * Binds a native local date-time input to a string field.
 * @remarks
 * Keeps the platform's local date-time UI and its standard encoded value.
 * @since 1.0.0
 * @category Native controls
 */
export const DateTimeLocalInput = makeInput("datetime-local", Schema.String);
/**
 * Binds a native month input to a string field.
 * @remarks
 * Preserves the browser month picker and standardized string encoding.
 * @since 1.0.0
 * @category Native controls
 */
export const MonthInput = makeInput("month", Schema.String);
/**
 * Binds a native week input to a string field.
 * @remarks
 * Preserves platform week-entry behavior and standardized string encoding.
 * @since 1.0.0
 * @category Native controls
 */
export const WeekInput = makeInput("week", Schema.String);
/**
 * Binds a native number input to a finite number field.
 * @remarks
 * `FiniteFromString` makes the browser's string value an explicit typed decode.
 * @since 1.0.0
 * @category Native controls
 */
export const NumberInput = makeInput("number", Schema.FiniteFromString);
/**
 * Binds a native range input to a finite number field.
 * @remarks
 * Retains native slider interaction while exposing a decoded numeric value.
 * @since 1.0.0
 * @category Native controls
 */
export const RangeInput = makeInput("range", Schema.FiniteFromString);
/**
 * Binds a native date input to a `Date` field.
 * @remarks
 * `DateFromString` makes the native encoded value's conversion explicit and fallible.
 * @since 1.0.0
 * @category Native controls
 */
export const DateInput = makeInput("date", Schema.DateFromString);

/**
 * Native value emitted by `FormData`.
 * @remarks
 * Browser serialization produces strings and Files; the union states that boundary exactly.
 * Files remain browser-owned objects referenced by the converted record.
 * @since 1.0.0
 * @category Browser form data
 */
export type FormDataValue = string | File;
/**
 * Object representation of native FormData, preserving repeated names as arrays.
 * @remarks
 * A plain record is directly consumable by Effect Schema without losing repeats.
 * Conversion allocates arrays/record entries but retains original File objects.
 * @since 1.0.0
 * @category Browser form data
 */
export type FormDataRecord = Readonly<Record<string, FormDataValue | ReadonlyArray<FormDataValue>>>;

/**
 * Converts native form data to a record, preserving repeated names as arrays.
 * @example
 * ```ts
 * import { formDataToRecord } from "@typed/ui/Form"
 *
 * const data = new FormData()
 * data.append("tag", "one")
 * data.append("tag", "two")
 * const record = formDataToRecord(data)
 * ```
 * @since 1.0.0
 * @category Browser form data
 */
export function formDataToRecord(data: FormData): FormDataRecord {
  const result: Record<string, FormDataValue | ReadonlyArray<FormDataValue>> = {};
  for (const [name, value] of data.entries()) {
    const existing = result[name];
    result[name] =
      existing === undefined
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
  }
  return result;
}

/**
 * Decodes native FormData through an Effect Schema codec.
 * @remarks
 * Browser serialization, repeated values, Files, and typed validation meet at
 * one explicit fallible boundary.
 * The returned Effect is lazy and owns no browser resource; it references File
 * objects present in the supplied FormData.
 * @example
 * ```ts
 * import { decodeFormData } from "@typed/ui/Form"
 * import { Schema } from "effect"
 *
 * const decode = decodeFormData(Schema.Struct({ name: Schema.String }), new FormData())
 * ```
 * @since 1.0.0
 * @category Browser form data
 */
export function decodeFormData<Values extends object, Codec extends Schema.Codec<Values, unknown>>(
  codec: Codec,
  data: FormData,
) {
  return Schema.decodeEffect(codec)(formDataToRecord(data));
}

/**
 * Checks retained decoded values against the form codec Type.
 *
 * @remarks
 * Success replaces values and clears errors. Failure copies the aggregate schema message across
 * fields and re-fails with SchemaError; this is not per-field issue-path mapping. A prior input
 * decode error does not independently block success when the retained decoded value still
 * validates.
 * @since 1.0.0
 * @category Validation
 */
export function validate<Values extends object>(state: FormState<Values>) {
  return Effect.flatMap(state, (current) =>
    Schema.decodeUnknownEffect(Schema.toType(state.codec))(current.values),
  ).pipe(
    Effect.flatMap((values) =>
      Effect.as(
        RefSubject.update(state, (current) => ({
          ...current,
          values,
          errors: {},
        })),
        values,
      ),
    ),
    Effect.catch((error) =>
      RefSubject.update(state, (current) => ({
        ...current,
        errors: formErrors(current.values, current.errors, error.message),
      })).pipe(Effect.andThen(Effect.fail(error))),
    ),
  );
}

function formErrors<Values extends object>(
  values: Values,
  errors: Partial<Record<keyof Values & string, string>>,
  error: string,
): Partial<Record<keyof Values & string, string>> {
  const next = { ...errors };
  for (const key of Object.keys(values)) Reflect.set(next, key, error);
  return next;
}

/**
 * Named decoded segment in a bidirectional text mask.
 * @remarks
 * The codec preserves the slot's domain type. Supply a fixed length and charset
 * when the input should insert unambiguous surrounding literals while editing.
 * Use string codecs for identifiers such as phone segments that may start with zero.
 * @since 1.0.0
 * @category Input codecs
 */
export interface MaskSlot<Name extends string = string, Value = unknown> {
  /**
   * Discriminant used to distinguish slots from literal mask parts.
   */
  readonly _tag: "MaskSlot";
  /**
   * Property name written into the decoded mask object.
   */
  readonly name: Name;
  /**
   * Bidirectional conversion between this slot's string segment and decoded value.
   */
  readonly codec: Schema.Codec<Value, string>;
  /**
   * Exact encoded character count, when fixed-width.
   */
  readonly length?: number;
  /**
   * Per-character acceptance test applied before Schema decoding.
   */
  readonly charset?: RegExp | ((character: string) => boolean);
}

/**
 * Literal or decoded segment of a mask.
 * @remarks
 * The tuple order completely specifies parsing and formatting.
 * Immutable description data with no runtime ownership.
 * @since 1.0.0
 * @category Input codecs
 */
export type MaskPart = string | MaskSlot;
/**
 */
export type MaskValue<Parts extends ReadonlyArray<MaskPart>> = {
  readonly [
    Part in Parts[number] as Part extends MaskSlot<infer Name> ? Name : never
  ]: Part extends MaskSlot<string, infer Value> ? Value : never;
};

/**
 * Creates a named, Schema-decoded mask slot.
 * @remarks
 * Length and character constraints are expressed beside the codec that owns conversion.
 * Pure constructor; the returned descriptor retains the codec but acquires no Scope.
 * @example
 * ```ts
 * import { slot } from "@typed/ui/Form"
 * import { Schema } from "effect"
 *
 * const areaCode = slot("area", Schema.String, { length: 3, charset: /[0-9]/ })
 * ```
 * @since 1.0.0
 * @category Input codecs
 */
export function slot<Name extends string, Value>(
  name: Name,
  codec: Schema.Codec<Value, string>,
  options: Omit<MaskSlot<Name, Value>, "_tag" | "name" | "codec"> = {},
): MaskSlot<Name, Value> {
  return { _tag: "MaskSlot", name, codec, ...options };
}

const maskParts = new WeakMap<object, ReadonlyArray<MaskPart>>();
const maskedInputResets = new WeakMap<
  object,
  { readonly signal: Subject.Subject<void>; users: number }
>();

/**
 * Builds a bidirectional Schema codec from literal text and named slots.
 * @remarks
 * Strict encoding and decoding share the same parts and reject invalid length,
 * characters, literals, or slot values. MaskedInput also uses these parts to
 * retain drafts and format fixed-width slots with explicit charsets. Literal
 * characters must be distinguishable from editable characters for auto-formatting;
 * ambiguous or variable-width masks retain ordinary strict text entry.
 * @example
 * ```ts
 * import { mask, slot } from "@typed/ui/Form"
 * import { Schema } from "effect"
 *
 * const phone = mask("(", slot("area", Schema.String, { length: 3 }), ") ",
 *   slot("number", Schema.String, { length: 7 }))
 * ```
 * @since 1.0.0
 * @category Input codecs
 */
export function mask<const Parts extends ReadonlyArray<MaskPart>>(
  ...parts: Parts
): Schema.Codec<MaskValue<Parts>, string> {
  const valueSchema = Schema.declare<MaskValue<Parts>>(
    (value): value is MaskValue<Parts> =>
      typeof value === "object" &&
      value !== null &&
      parts.every((part) => typeof part === "string" || Reflect.has(value, part.name)),
  );
  const codec = Schema.String.pipe(
    Schema.decodeTo(
      valueSchema,
      SchemaTransformation.transformOrFail({
        decode: (display, options) => decodeMask(parts, display, options),
        encode: (value, options) => encodeMask(parts, value, options),
      }),
    ),
  );
  maskParts.set(codec, parts);
  return codec;
}

function maskedInputProps<Values extends object, Value>(
  options: InputOptions<Values, Value>,
  type: string,
  codec: Schema.Codec<Value, string>,
  parts: ReadonlyArray<MaskPart>,
) {
  return () => {
    let draft: string | undefined;
    let lastValue: unknown;
    let composing = false;
    let invalidDraft = false;
    let editRevision = 0;
    let pending: State<Values> | undefined;
    let input: HTMLInputElement | undefined;
    const format = maskDraftFormatter(parts);
    const message = `Enter a complete value in the format ${parts
      .map((part) => (typeof part === "string" ? part : "_".repeat(part.length ?? 3)))
      .join("")}.`;

    const commit = Effect.fn(function* (element: HTMLInputElement) {
      const revision = ++editRevision;
      const snapshot = yield* options.state;
      pending = snapshot;
      input = element;
      const formatted = format?.(element.value, element.selectionStart ?? element.value.length);
      if (formatted !== undefined) {
        element.value = formatted.value;
        element.setSelectionRange(formatted.cursor, formatted.cursor);
      }
      draft = element.value;
      return yield* Schema.decodeEffect(codec)(draft).pipe(
        Effect.matchEffect({
          onSuccess: Effect.fn(function* (decoded) {
            if (
              revision !== editRevision ||
              (yield* options.state).values[options.name] !== snapshot.values[options.name]
            )
              return;
            pending = undefined;
            lastValue = decoded;
            invalidDraft = false;
            element.setCustomValidity("");
            yield* updateDecodedValue(options.state, options.name, decoded);
            yield* setFieldError(options.state, options.name, undefined);
          }),
          onFailure: Effect.fn(function* () {
            if (
              revision !== editRevision ||
              (yield* options.state).values[options.name] !== snapshot.values[options.name]
            )
              return;
            pending = undefined;
            invalidDraft = true;
            element.setCustomValidity(message);
            yield* setFieldError(options.state, options.name, message);
          }),
        }),
      );
    });

    return {
      type,
      name: options.name,
      "aria-describedby": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined
          ? undefined
          : fieldErrorId(options.state, options.name),
      ),
      "aria-invalid": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined ? undefined : true,
      ),
      ".value": Effect.flatMap(options.state, (state) =>
        Schema.encodeUnknownEffect(codec)(state.values[options.name]),
      ),
      ref: Effect.fn(function* (element: HTMLInputElement) {
        input = element;
        const initial = yield* options.state;
        lastValue = initial.values[options.name];
        const resetInput = Effect.gen(function* () {
          const revision = ++editRevision;
          pending = undefined;
          draft = undefined;
          invalidDraft = false;
          composing = false;
          const value = (yield* options.state).values[options.name];
          lastValue = value;
          element.setCustomValidity("");
          const encoded = yield* Schema.encodeUnknownEffect(codec)(value);
          if (revision === editRevision && (yield* options.state).values[options.name] === value) {
            element.value = encoded;
          }
        });
        let resets = maskedInputResets.get(options.state);
        if (resets === undefined) {
          resets = { signal: Subject.unsafeMake<void>(), users: 0 };
          maskedInputResets.set(options.state, resets);
        }
        const resetSignal = resets;
        resetSignal.users++;
        yield* Scope.addFinalizer(
          yield* Effect.scope,
          Effect.suspend(() => {
            if (--resetSignal.users > 0) return Effect.void;
            maskedInputResets.delete(options.state);
            return resetSignal.signal.interrupt;
          }),
        );
        yield* Effect.forkScoped(FxApi.observe(resetSignal.signal, () => resetInput));
        yield* Effect.forkScoped(
          FxApi.observe(
            options.state,
            Effect.fn(function* (state) {
              if (
                pending !== undefined &&
                state.values[options.name] !== pending.values[options.name]
              ) {
                pending = undefined;
                editRevision++;
                draft = undefined;
                invalidDraft = false;
              }
              const value = state.values[options.name];
              if (
                value === lastValue &&
                (composing ||
                  (draft !== undefined &&
                    (!invalidDraft || state.errors[options.name] !== undefined)))
              )
                return;
              lastValue = value;
              draft = undefined;
              invalidDraft = false;
              element.setCustomValidity("");
              const revision = editRevision;
              const encoded = yield* Schema.encodeUnknownEffect(codec)(value);
              if (
                revision === editRevision &&
                (yield* options.state).values[options.name] === value &&
                element.value !== encoded
              ) {
                element.value = encoded;
              }
            }),
          ),
        );
      }),
      onbeforeinput: EventHandler.make(
        Effect.fn(function* (event: InputEvent) {
          if (event.isComposing || composing || !event.cancelable || format === undefined) return;
          if (
            event.inputType !== "deleteContentBackward" &&
            event.inputType !== "deleteContentForward"
          )
            return;
          const element = Dom.currentTarget<HTMLInputElement>(event);
          const start = element.selectionStart;
          if (start === null || start !== element.selectionEnd) return;
          const backwards = event.inputType === "deleteContentBackward";
          const separators = parts
            .filter((part): part is string => typeof part === "string")
            .join("");
          let index = backwards ? start - 1 : start;
          if (!separators.includes(element.value[index] ?? "\u0000")) return;
          while (
            index >= 0 &&
            index < element.value.length &&
            separators.includes(element.value[index])
          ) {
            index += backwards ? -1 : 1;
          }
          if (index < 0 || index >= element.value.length) return;
          event.preventDefault();
          element.setRangeText("", index, index + 1, "start");
          return yield* commit(element);
        }),
      ),
      oninput: EventHandler.make(
        Effect.fn(function* (event: InputEvent) {
          input = Dom.currentTarget<HTMLInputElement>(event);
          if (composing || event.isComposing) return;
          return yield* commit(input);
        }),
      ),
      oncompositionstart: EventHandler.make(() =>
        Effect.sync(() => {
          composing = true;
        }),
      ),
      oncompositionend: EventHandler.make(
        Effect.fn(function* (event: CompositionEvent) {
          composing = false;
          return yield* commit(Dom.currentTarget<HTMLInputElement>(event));
        }),
      ),
    } as const;
  };
}

// Only auto-format when fixed-width slots explicitly distinguish editable
// characters from literals. Ambiguous/variable-width codecs still retain drafts
// and validate, without guessing which characters the user meant to enter.
function maskDraftFormatter(parts: ReadonlyArray<MaskPart>) {
  const slots = parts.filter((part): part is MaskSlot => typeof part !== "string");
  const literals = parts.filter((part): part is string => typeof part === "string").join("");
  if (
    slots.length === 0 ||
    slots.some(
      (slot) => slot.length === undefined || slot.charset === undefined || slot.length < 1,
    ) ||
    [...literals].some((character) => slots.some((slot) => matchesCharset(slot, character)))
  )
    return undefined;
  return (text: string, cursor: number): { value: string; cursor: number } | undefined => {
    const characters: string[] = [];
    let beforeCursor = 0;
    for (let index = 0; index < text.length; index++) {
      const character = text[index];
      if (literals.includes(character)) continue;
      characters.push(character);
      if (index < cursor) beforeCursor++;
    }
    let offset = 0;
    let value = "";
    let nextCursor = 0;
    for (const [index, part] of parts.entries()) {
      if (typeof part === "string") {
        const complete = characters.length === slots.reduce((sum, slot) => sum + slot.length!, 0);
        const suffix = parts.slice(index + 1).every((remaining) => typeof remaining === "string");
        if (offset < characters.length || (complete && suffix)) value += part;
        continue;
      }
      const segment = characters.slice(offset, offset + part.length!);
      if (segment.some((character) => !matchesCharset(part, character))) return undefined;
      for (const character of segment) {
        value += character;
        offset++;
        if (offset <= beforeCursor) nextCursor = value.length;
      }
    }
    if (offset !== characters.length) return undefined;
    return { value, cursor: beforeCursor === characters.length ? value.length : nextCursor };
  };
}

function decodeMask<Parts extends ReadonlyArray<MaskPart>>(
  parts: Parts,
  display: string,
  options: SchemaAST.ParseOptions,
): Effect.Effect<MaskValue<Parts>, SchemaIssue.Issue> {
  return Effect.gen(function* () {
    const value: Record<string, unknown> = {};
    let offset = 0;
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      if (typeof part === "string") {
        if (!display.startsWith(part, offset)) return yield* invalidMask(display, options);
        offset += part.length;
        continue;
      }
      const nextLiteral = parts.slice(index + 1).find((next) => typeof next === "string");
      const end =
        part.length === undefined
          ? nextLiteral === undefined
            ? display.length
            : display.indexOf(nextLiteral, offset)
          : offset + part.length;
      if (end < offset) return yield* invalidMask(display, options);
      const encoded = display.slice(offset, end);
      if (
        encoded.length === 0 ||
        (part.length !== undefined && encoded.length !== part.length) ||
        [...encoded].some((character) => !matchesCharset(part, character))
      )
        return yield* invalidMask(display, options);
      const decoded = yield* Schema.decodeEffect(part.codec)(encoded).pipe(
        Effect.mapError(
          () => new SchemaIssue.InvalidValue({ message: `Invalid ${part.name}` }, display, options),
        ),
      );
      Reflect.set(value, part.name, decoded);
      offset = end;
    }
    if (offset !== display.length || !isMaskValue(parts, value))
      return yield* invalidMask(display, options);
    return value;
  });
}

function encodeMask<Parts extends ReadonlyArray<MaskPart>>(
  parts: Parts,
  value: MaskValue<Parts>,
  options: SchemaAST.ParseOptions,
): Effect.Effect<string, SchemaIssue.Issue> {
  return Effect.gen(function* () {
    let display = "";
    for (const part of parts) {
      if (typeof part === "string") {
        display += part;
        continue;
      }
      const encoded = yield* Schema.encodeUnknownEffect(part.codec)(
        Reflect.get(value, part.name),
      ).pipe(
        Effect.mapError(
          () => new SchemaIssue.InvalidValue({ message: `Invalid ${part.name}` }, value, options),
        ),
      );
      if (
        encoded.length === 0 ||
        (part.length !== undefined && encoded.length !== part.length) ||
        [...encoded].some((character) => !matchesCharset(part, character))
      )
        return yield* invalidMask(value, options);
      display += encoded;
    }
    return display;
  });
}

function isMaskValue<Parts extends ReadonlyArray<MaskPart>>(
  parts: Parts,
  value: unknown,
): value is MaskValue<Parts> {
  return (
    typeof value === "object" &&
    value !== null &&
    parts.every((part) => typeof part === "string" || Reflect.has(value, part.name))
  );
}

function matchesCharset(slot: MaskSlot, character: string): boolean {
  if (slot.charset === undefined) return true;
  if (slot.charset instanceof RegExp) {
    slot.charset.lastIndex = 0;
    return slot.charset.test(character);
  }
  return slot.charset(character);
}

function invalidMask(
  input: unknown,
  options: SchemaAST.ParseOptions,
): Effect.Effect<never, SchemaIssue.Issue> {
  return Effect.fail(new SchemaIssue.InvalidValue({ message: "Invalid mask" }, input, options));
}

/**
 * Options for an input decoded through a structured mask codec.
 * @remarks
 * A normal text input can expose a structured typed value without hiding native events or props.
 * The control Scope owns DOM work; form state and the mask codec remain independently owned.
 * @since 1.0.0
 * @category Input codecs
 */
export interface MaskedInputOptions<
  Values extends object,
  Parts extends ReadonlyArray<MaskPart>,
> extends InputOptions<Values, MaskValue<Parts>> {
  /**
   * Bidirectional mask codec used for display and input decoding.
   */
  readonly mask: Schema.Codec<MaskValue<Parts>, string>;
}

/**
 * Binds a native text input to a structured mask value.
 * @remarks
 * A codec created by mask supplies the editable format. Fixed-width slots with
 * explicit charsets receive literal insertion and caret-aware deletion; other
 * codecs retain strict text entry. Incomplete drafts remain visible while decoded
 * state keeps its previous value. Native custom validity and field error text
 * prevent native submission of an incomplete mask. Composition is committed only
 * after compositionend. New edits and resets supersede pending slot decoders.
 * Each mounted input owns its draft observer and reset registration in Scope.
 * @since 1.0.0
 * @category Input codecs
 */
export function MaskedInput<
  const Values extends object,
  const Parts extends ReadonlyArray<MaskPart>,
  const Options extends MaskedInputOptions<Values, Parts>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<MaskedInputOptions<Values, Parts>, "state" | "name" | "mask">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Omit<Options, "mask">, InputProps<Values, MaskValue<Parts>>>,
    "",
    Host
  >,
): Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableComponentOptions<Omit<Options, "mask">> | Host>,
  | Renderable.Services<RenderableComponentOptions<Omit<Options, "mask">> | Host>
  | Scope.Scope
  | RenderTemplate
> {
  const { mask, ...inputOptions } = options;
  return renderInput(inputOptions, host, "text", mask);
}

/**
 * Options for a state-explicit native checkbox.
 * @remarks
 * Boolean field inference and live `checked` binding preserve native checkbox behavior.
 * The control Scope owns the listener/binding; form state may outlive the element.
 * @since 1.0.0
 * @category Component options
 */
export interface CheckboxOptions<Values extends object> extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Renderer-independent state read and updated by the checkbox.
   */
  readonly state: FormState<Values>;
  /**
   * Boolean field controlled by the checkbox.
   */
  readonly name: BooleanFieldName<Values>;
}

function checkboxProps<Values extends object>(options: CheckboxOptions<Values>) {
  const checked = RefSubject.map(options.state, (state) => state.values[options.name] === true);
  return () =>
    ({
      type: "checkbox",
      name: options.name,
      "aria-describedby": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined
          ? undefined
          : fieldErrorId(options.state, options.name),
      ),
      "aria-invalid": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined ? undefined : true,
      ),
      "?checked": checked,
      ".checked": checked,
      onchange: EventHandler.make(
        Effect.fn((event: Event) =>
          decodeUpdatedField(
            options.state,
            options.name,
            Dom.currentTarget<HTMLInputElement>(event).checked,
          ),
        ),
      ),
    }) as const;
}

type CheckboxProps<Values extends object> = ReturnType<ReturnType<typeof checkboxProps<Values>>>;

/**
 * Binds a native checkbox to a boolean form field.
 * @remarks
 * Both the checked attribute and live property follow state, while the browser's
 * real change event is decoded through the field codec.
 * The rendered Scope owns the input, listener, and subscriptions. A custom host
 * must apply merged name, ARIA, checked, and change props.
 * @since 1.0.0
 * @category Native controls
 */
export function Checkbox<
  const Values extends object,
  const Options extends CheckboxOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<CheckboxOptions<Values>, "state" | "name">,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, CheckboxProps<Values>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<Options, CheckboxProps<Values>, "", HostResult, Host>(
    options,
    host,
    checkboxProps(options),
    "",
    (props) => html`<input ...${props} />`,
  );
}

/**
 * Options for a state-explicit native select.
 * @remarks
 * Callers author ordinary option markup while the selected value binds to typed state.
 * The control Scope owns content, listener, and binding; form state may outlive it.
 * @since 1.0.0
 * @category Component options
 */
export interface SelectOptions<Values extends object> extends Dom.HostOptions<HTMLSelectElement> {
  /**
   * Renderer-independent state read and updated by the select.
   */
  readonly state: FormState<Values>;
  /**
   * String field controlled by the select.
   */
  readonly name: FieldNameFor<Values, string>;
  /**
   * Native option/optgroup renderable content.
   */
  readonly content: Renderable.Any;
}

function selectProps<Values extends object>(options: SelectOptions<Values>) {
  return () =>
    ({
      name: options.name,
      "aria-describedby": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined
          ? undefined
          : fieldErrorId(options.state, options.name),
      ),
      "aria-invalid": RefSubject.map(options.state, (state) =>
        state.errors[options.name] === undefined ? undefined : true,
      ),
      ".value": RefSubject.map(options.state, (state) => String(state.values[options.name])),
      onchange: EventHandler.make(
        Effect.fn((event: Event) =>
          decodeUpdatedField(
            options.state,
            options.name,
            Dom.currentTarget<HTMLSelectElement>(event).value,
          ),
        ),
      ),
    }) as const;
}

type SelectProps<Values extends object> = ReturnType<ReturnType<typeof selectProps<Values>>>;

/**
 * Binds a native select element to a string form field.
 * @remarks
 * Native keyboard, accessibility, option, and form semantics remain browser-owned.
 * The rendered Scope owns the select/content subscriptions. A custom host must
 * preserve supplied name, ARIA, value, and change props.
 * @since 1.0.0
 * @category Native controls
 */
export function Select<
  const Values extends object,
  const Options extends SelectOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<SelectOptions<Values>, "state" | "name" | "content">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SelectProps<Values>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLSelectElement>()<
    Options,
    SelectProps<Values>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    selectProps(options),
    options.content,
    (props, content) =>
      html`<select ...${props}>
        ${content}
      </select>`,
  );
}

/**
 * Options for a native form label.
 * @remarks
 * Explicit `for` linkage keeps accessible naming in browser-standard markup.
 * The label Scope owns rendered content only; it does not own the referenced control.
 * @since 1.0.0
 * @category Field relationships
 */
export interface LabelOptions extends Dom.HostOptions<HTMLLabelElement> {
  /**
   * ID of the native control labeled by this element.
   */
  readonly for: string;
  /**
   * Human-readable label content.
   */
  readonly content: Renderable.Any;
}
function labelProps<const Options extends LabelOptions>(options: Options) {
  return () => ({ for: options.for }) as const;
}
type LabelProps<Options extends LabelOptions> = ReturnType<ReturnType<typeof labelProps<Options>>>;
/**
 * Renders a native label with an explicit control relationship.
 * @remarks
 * The browser supplies click-to-focus and accessible-name behavior with no synthetic layer.
 * The Scope owns label output/content; the referenced element remains separately owned.
 * @since 1.0.0
 * @category Field relationships
 */
export function Label<const Options extends LabelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, LabelProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLLabelElement>()<
    Options,
    LabelProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    labelProps(options),
    options.content,
    (props, content) => html`<label ...${props}>${content}</label>`,
  );
}

/**
 * Options for descriptive form content.
 * @remarks
 * Provides a host-overrideable descriptive region without inventing text semantics.
 * The host Scope owns the rendered content.
 * @since 1.0.0
 * @category Field relationships
 */
export interface DescriptionOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Descriptive renderable content.
   */
  readonly content: Renderable.Any;
}

function descriptionProps() {
  return () => ({}) as const;
}
type DescriptionProps = ReturnType<ReturnType<typeof descriptionProps>>;
/**
 * Renders visible explanatory content in a neutral div.
 *
 * @remarks
 * No control relationship is created automatically. The current input binding owns its generated
 * error aria-describedby; do not assume consumer description IDs are merged into it.
 * @since 1.0.0
 * @category Field relationships
 */
export function Description<
  const Options extends DescriptionOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, DescriptionProps>, Options["content"], Host>,
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    DescriptionProps,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    descriptionProps(),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Options for a field validation alert.
 * @remarks
 * Error identity derives from form and field IDs so controls can reference it reliably.
 * The error host subscribes within its Scope; form state remains independently owned.
 * @since 1.0.0
 * @category Field relationships
 */
export interface ErrorOptions<Values extends object> extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent state supplying validation errors.
   */
  readonly state: FormState<Values>;
  /**
   * Field whose current message is rendered.
   */
  readonly name: keyof Values & string;
}

function errorProps<Values extends object>(options: ErrorOptions<Values>) {
  return () =>
    ({
      id: fieldErrorId(options.state, options.name),
      role: "alert",
    }) as const;
}
type ErrorProps<Values extends object> = ReturnType<ReturnType<typeof errorProps<Values>>>;
/**
 * Renders the named field message with a generated ID and alert role.
 *
 * @remarks
 * Bound inputs refer to this ID through aria-describedby and expose aria-invalid when an error
 * exists. Keep the form ID stable and render one matching error host per field. Alert timing
 * still depends on the browser and assistive technology; this is not an announcement queue.
 * @since 1.0.0
 * @category Field relationships
 */
export function Error<
  const Values extends object,
  const Options extends ErrorOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<ErrorOptions<Values>, "state" | "name">,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, ErrorProps<Values>>, Renderable.Any, Host>,
) {
  const content = RefSubject.map(options.state, (state) => state.errors[options.name] ?? "");
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    ErrorProps<Values>,
    Renderable.Any,
    HostResult,
    Host
  >(
    options,
    host,
    errorProps(options),
    content,
    (props, value) => html`<div ...${props}>${value}</div>`,
  );
}

/**
 * Options for a native submit button.
 * @remarks
 * Uses ordinary form submission semantics while exposing all button props/events.
 * The button Scope owns rendered content and listeners.
 * @since 1.0.0
 * @category Component options
 */
export interface SubmitOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Submit button label/content.
   */
  readonly content: Renderable.Any;
}
function submitProps() {
  return () => ({ type: "submit" }) as const;
}
type SubmitProps = ReturnType<ReturnType<typeof submitProps>>;
/**
 * Renders a native `type=submit` button.
 * @remarks
 * Keyboard activation, form association, and accessibility stay browser-standard.
 * The Scope owns the button/content; the surrounding Form owns submission sequencing.
 * @since 1.0.0
 * @category Form actions
 */
export function Submit<const Options extends SubmitOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SubmitProps>, Options["content"], Host>,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    SubmitProps,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    submitProps(),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Options for a state-explicit reset button.
 * @remarks
 * Native reset activation can restore renderer-independent Typed state deterministically.
 * The click Effect runs in the button Scope; state may outlive the button.
 * @since 1.0.0
 * @category Component options
 */
export interface ResetOptions<Values extends object> extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent state restored on activation.
   */
  readonly state: FormState<Values>;
  /**
   * Reset button label/content.
   */
  readonly content: Renderable.Any;
}
function resetProps<Values extends object>(options: ResetOptions<Values>) {
  return () =>
    ({
      type: "reset",
      onclick: EventHandler.preventDefault(
        EventHandler.fromEffectOrEventHandler(reset(options.state)),
      ),
    }) as const;
}
type ResetProps<Values extends object> = ReturnType<ReturnType<typeof resetProps<Values>>>;
/**
 * Renders a native reset button that restores Typed form defaults.
 * @remarks
 * It prevents the browser's independent control mutation and resets the single
 * RefSubject source of truth, clearing errors, metadata, and submitting state.
 * The Scope owns the click handler/content. The supplied form state remains independently owned.
 * @since 1.0.0
 * @category Form actions
 */
export function Reset<
  const Values extends object,
  const Options extends ResetOptions<Values>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<ResetOptions<Values>, "state" | "content">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ResetProps<Values>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    ResetProps<Values>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    resetProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Options for an accessible group of form controls.
 * @remarks
 * Provides a native host with `role=group` and optional accessible label.
 * The group Scope owns child renderables but not their independent form state.
 * @since 1.0.0
 * @category Field relationships
 */
export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Controls or other renderable members of the group.
   */
  readonly content: Renderable.Any;
  /**
   * Optional accessible name applied through `aria-label`.
   */
  readonly label?: string;
}
function groupProps<const Options extends GroupOptions>(options: Options) {
  return () => ({ role: "group", "aria-label": options.label }) as const;
}
type GroupProps<Options extends GroupOptions> = ReturnType<ReturnType<typeof groupProps<Options>>>;
/**
 * Renders an ARIA group with an optional accessible name.
 * @remarks
 * Related controls can expose their relationship without a framework-specific wrapper.
 * The Scope owns host/content; child controls retain their own DOM/state contracts.
 * @since 1.0.0
 * @category Field relationships
 */
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    GroupProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Options for an array-field append button.
 * @remarks
 * The field name and appended item are derived from the form value type.
 * The click Effect runs in the button Scope; form state remains independently owned.
 * @since 1.0.0
 * @category Component options
 */
export interface PushOptions<
  Values extends object,
  Name extends ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent state updated on activation.
   */
  readonly state: FormState<Values>;
  /**
   * Array-valued field to append to.
   */
  readonly name: Name;
  /**
   * Type-compatible item appended to the field.
   */
  readonly value: ArrayFieldValue<Values, Name>;
  /**
   * Button label/content.
   */
  readonly content: Renderable.Any;
}
function pushProps<Values extends object, Name extends ArrayFieldName<Values>>(
  options: PushOptions<Values, Name>,
) {
  return () =>
    ({
      type: "button",
      onclick: pushValue(options.state, options.name, options.value),
    }) as const;
}
type PushProps<Values extends object, Name extends ArrayFieldName<Values>> = ReturnType<
  ReturnType<typeof pushProps<Values, Name>>
>;
/**
 * Renders a button that appends one item to an array field.
 * @remarks
 * Array mutation is immutable, typed, and marks the field dirty/touched.
 * The Scope owns the button handler/content; state may outlive the button.
 * @since 1.0.0
 * @category Form actions
 */
export function Push<
  const Values extends object,
  const Name extends ArrayFieldName<Values>,
  const Options extends PushOptions<Values, Name>,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, PushProps<Values, Name>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    PushProps<Values, Name>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    pushProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Options for an array-field removal button.
 * @remarks
 * The array field is type-checked and the local index is explicit.
 * The click Effect runs in the button Scope; form state remains independently owned.
 * @since 1.0.0
 * @category Component options
 */
export interface RemoveOptions<
  Values extends object,
  Name extends ArrayFieldName<Values>,
> extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent state updated on activation.
   */
  readonly state: FormState<Values>;
  /**
   * Array-valued field to remove from.
   */
  readonly name: Name;
  /**
   * Zero-based item index removed from the field.
   */
  readonly index: number;
  /**
   * Button label/content.
   */
  readonly content: Renderable.Any;
}
function removeProps<Values extends object, Name extends ArrayFieldName<Values>>(
  options: RemoveOptions<Values, Name>,
) {
  return () =>
    ({
      type: "button",
      onclick: removeValue(options.state, options.name, options.index),
    }) as const;
}
type RemoveProps<Values extends object, Name extends ArrayFieldName<Values>> = ReturnType<
  ReturnType<typeof removeProps<Values, Name>>
>;
/**
 * Renders a button that removes one array item by index.
 * @remarks
 * Array mutation is immutable, typed, and marks the field dirty/touched.
 * The Scope owns the button handler/content; state may outlive the button.
 * @since 1.0.0
 * @category Form actions
 */
export function Remove<
  const Values extends object,
  const Name extends ArrayFieldName<Values>,
  const Options extends RemoveOptions<Values, Name>,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RemoveProps<Values, Name>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    RemoveProps<Values, Name>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    removeProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}
/**
 * Assigns one decoded field value and updates dirty/touched metadata.
 *
 * @remarks
 * The helper does not decode or validate the supplied value and does not clear an existing field
 * error. Use validate for an explicit whole-form check. Dirty tracking compares against the
 * default field with !==; updates replace the top-level values record.
 * @since 1.0.0
 * @category State transitions
 */
export function setValue<Values extends object, Key extends keyof Values & string, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  key: Key,
  value: Values[Key],
): Effect.Effect<State<Values>, E, R> {
  return updateDecodedValue(state, key, value);
}

function updateDecodedValue<Values extends object, Key extends keyof Values & string, Value, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  key: Key,
  value: Value,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: updateRecord(current.values, key, value),
    meta: {
      ...current.meta,
      [key]: { dirty: current.defaultValues[key] !== value, touched: true },
    },
  }));
}

function updateRecord<Values extends object, Key extends keyof Values & string, Value>(
  values: Values,
  key: Key,
  value: Value,
): Values {
  const updated = { ...values };
  Reflect.set(updated, key, value);
  return updated;
}
/**
 * Restores default values and clears errors, metadata, and submitting.
 *
 * @remarks
 * The defaultValues object is reused rather than deep-cloned. This state operation does not
 * cancel a running submission Effect or reset independently owned result state.
 * @since 1.0.0
 * @category State transitions
 */
export function reset<Values extends object, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    values: current.defaultValues,
    errors: {},
    meta: {},
    submitting: false,
  })).pipe(
    Effect.tap(() =>
      Effect.suspend(
        () => maskedInputResets.get(state)?.signal.onSuccess(undefined) ?? Effect.void,
      ),
    ),
  );
}

/**
 */
export type BooleanFieldName<Values extends object> = FieldNameFor<Values, boolean>;
/**
 */
export type ArrayFieldName<Values extends object> = {
  [Key in keyof Values & string]: Values[Key] extends ReadonlyArray<unknown> ? Key : never;
}[keyof Values & string];
/**
 */
export type ArrayFieldValue<Values extends object, Name extends ArrayFieldName<Values>> =
  Values[Name] extends ReadonlyArray<infer Value> ? Value : never;

/**
 * Appends one item to an array field and marks it dirty and touched.
 * @remarks
 * The immutable state transition is usable in tests, commands, or any renderer.
 * The returned Effect performs one RefSubject update when run.
 * @since 1.0.0
 * @category State transitions
 */
export function pushValue<Values extends object, Name extends ArrayFieldName<Values>, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  value: ArrayFieldValue<Values, Name>,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const previous = Reflect.get(current.values, name);
    const values = Array.isArray(previous) ? [...previous, value] : [value];
    return {
      ...current,
      values: updateRecord(current.values, name, values),
      meta: { ...current.meta, [name]: { dirty: true, touched: true } },
    };
  });
}

/**
 * Removes one item by index from an array field and marks it dirty and touched.
 * @remarks
 * The transition is explicit and renderer-independent; an out-of-range index leaves values unchanged.
 * The returned Effect performs one RefSubject update when run.
 * @since 1.0.0
 * @category State transitions
 */
export function removeValue<Values extends object, Name extends ArrayFieldName<Values>, E, R>(
  state: RefSubject.RefSubject<State<Values>, E, R>,
  name: Name,
  index: number,
): Effect.Effect<State<Values>, E, R> {
  return RefSubject.update(state, (current) => {
    const previous = Reflect.get(current.values, name);
    const values = Array.isArray(previous)
      ? previous.filter((_, currentIndex) => currentIndex !== index)
      : [];
    return {
      ...current,
      values: updateRecord(current.values, name, values),
      meta: { ...current.meta, [name]: { dirty: true, touched: true } },
    };
  });
}

/**
 * Handler invoked only after whole-form Schema validation succeeds.
 * @remarks
 * Callers receive decoded values and the real native SubmitEvent, and may return an Effect.
 * A returned Effect runs inside the form submit handler and completes before `submitting` resets.
 * @since 1.0.0
 * @category Form roots
 */
export type ValidSubmitHandler<Values extends object, E = never, R = never> = (
  values: Values,
  event: SubmitEvent,
) => void | Effect.Effect<unknown, E, R>;

/**
 * Options for the state-explicit form root.
 * @remarks
 * The form supplies native submit/reset behavior and Effect context while its
 * data remains in a standalone hydrated RefSubject.
 * The root Scope owns DOM handlers/content and provides `CurrentForm` to descendants.
 * It borrows `state`; submission Effects are finalized before `submitting` is cleared.
 * @since 1.0.0
 * @category Form roots
 */
export interface FormOptions<
  Values extends object,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLFormElement> {
  /**
   * Hydrated renderer-independent state owned outside the form renderer.
   */
  readonly state: FormState<Values>;
  /**
   * Controls and other renderable form content.
   */
  readonly content: Renderable.Any;
  /**
   * Callback invoked with decoded values only after successful validation.
   */
  readonly onValidSubmit?: ValidSubmitHandler<Values, E, R>;
}
function formProps<
  const Values extends object,
  E,
  R,
  const Options extends FormOptions<Values, E, R>,
>(options: Options) {
  const setSubmitting = Effect.fn((submitting: boolean) =>
    RefSubject.update(options.state, (current) => ({ ...current, submitting })),
  );
  return () =>
    ({
      ref: options.state,
      onsubmit: EventHandler.make(
        Effect.fn((event: SubmitEvent) =>
          Effect.andThen(
            setSubmitting(true),
            Effect.matchEffect(validate(options.state), {
              onFailure: Effect.fn(() => Effect.void),
              onSuccess: Effect.fn((values) => {
                const result = options.onValidSubmit?.(values, event);
                return Effect.isEffect(result) ? result : Effect.void;
              }),
            }),
          ).pipe(
            Effect.ensuring(setSubmitting(false).pipe(Effect.catch(Effect.fn(() => Effect.void)))),
          ),
        ),
        { preventDefault: true },
      ),
      onreset: EventHandler.preventDefault(
        EventHandler.fromEffectOrEventHandler(reset(options.state)),
      ),
    }) as const;
}
type FormProps<Values extends object, E, R, Options extends FormOptions<Values, E, R>> = ReturnType<
  ReturnType<typeof formProps<Values, E, R, Options>>
>;
/**
 * Renders a native form and provides its state to bound descendants.
 *
 * @remarks
 * The submit listener synchronously prevents browser navigation, marks submitting, validates
 * decoded state, and runs onValidSubmit on success. Finalization clears submitting. Native
 * constraint validation can prevent submit dispatch before this handler runs. The root does not
 * read FormData, serialize a request, cancel duplicate submissions, or infer server errors.
 *
 * @example
 * ```ts
 * import { Form, Submit, TextInput, makeState } from "@typed/ui/Form"
 * import { Effect, Schema } from "effect"
 * import { html } from "@typed/template"
 *
 * const codec = Schema.Struct({ email: Schema.String })
 * const view = Effect.gen(function* () {
 *   const state = yield* makeState(codec, { id: "signup", values: { email: "" } })
 *   return Form({
 *     state,
 *     content: html`${TextInput({ state, name: "email" })}${Submit({ content: "Join" })}`,
 *     onValidSubmit: (values) => Effect.log(`Submitting ${values.email}`)
 *   })
 * })
 * ```
 * @since 1.0.0
 * @category Form roots
 */
export function Form<
  const Values extends object,
  E,
  R,
  const Options extends FormOptions<Values, E, R>,
  const Host extends HostResult = never,
>(
  options: Options & Pick<FormOptions<Values, E, R>, "state" | "content">,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, FormProps<Values, E, R, Options>>,
    Options["content"],
    Host
  >,
): SchemaBoundRootResult<Options, Host> {
  const rendered = Dom.renderHost<HTMLFormElement>()<
    Options,
    FormProps<Values, E, R, Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    formProps(options),
    options.content,
    (props, content) => html`<form ...${props}>${content}</form>`,
  ) as SchemaBoundComponentResult<Options, Host>;
  return FxApi.provideService(rendered, CurrentForm, {
    state: options.state,
  }) as SchemaBoundRootResult<Options, Host>;
}

/**
 * Options accepted by a schema-bound form root.
 * @remarks
 * The factory names the state `form` and supplies its schema/context automatically.
 * The root Scope borrows `form` and owns content, listeners, and submit Effects.
 * @since 1.0.0
 * @category Form roots
 */
export interface BoundFormOptions<
  Values extends object,
  E = never,
  R = never,
> extends Dom.HostOptions<HTMLFormElement> {
  /**
   * State previously created by the bound API's `state` constructor.
   */
  readonly form: FormState<Values>;
  /**
   * Schema-bound controls and other renderable form content.
   */
  readonly content: Renderable.Any;
  /**
   * Callback invoked with decoded values only after successful validation.
   */
  readonly onValidSubmit?: ValidSubmitHandler<Values, E, R>;
}

type CurrentFormIdentifier = Context.Service.Identifier<typeof CurrentForm>;

/**
 * Fx result of a schema-bound descendant control.
 * @remarks
 * Its type makes `CurrentForm`, render services, Schema errors, Scope, and custom-host
 * requirements explicit.
 * The parent form supplies `CurrentForm`; the running Scope owns DOM work.
 * @since 1.0.0
 * @category Schema-bound components
 */
export type SchemaBoundComponentResult<Options, Host> = Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableComponentOptions<Options> | Host>,
  | Renderable.Services<RenderableComponentOptions<Options> | Host>
  | CurrentFormIdentifier
  | Scope.Scope
  | RenderTemplate
>;

/**
 * Fx result of a schema-bound root after it provides `CurrentForm` internally.
 * @remarks
 * Consumers see only external render/host requirements, not the service supplied by the root itself.
 * The running Scope owns the service provision, listeners, and rendered range.
 * @since 1.0.0
 * @category Schema-bound components
 */
export type SchemaBoundRootResult<Options, Host> = Fx<
  RenderEvent,
  Schema.SchemaError | Renderable.Error<RenderableComponentOptions<Options> | Host>,
  | Exclude<Renderable.Services<RenderableComponentOptions<Options> | Host>, CurrentFormIdentifier>
  | Scope.Scope
  | RenderTemplate
>;

/**
 * Callable schema-bound input constructor for fields with one decoded value type.
 * @remarks
 * Struct field names, errors, and services remain inferred without passing state repeatedly.
 * Each call borrows `CurrentForm` and returns Scope-owned render work.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundInput<Fields extends FormFields, Value> {
  /**
   * Creates a bound native input and optionally delegates its merged props to a custom host.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <const Options extends object, const Host extends HostResult = never>(
    options: SchemaBoundInputOptions<Fields, Value> & Options,
    host?: Dom.HostOverride<Dom.HostProps<HTMLInputElement>, "", Host>,
  ): SchemaBoundComponentResult<Omit<Options, "name">, Host>;
}

/**
 * Callable schema-bound input using its selected field's string codec as a mask.
 * @remarks
 * Structured string encodings stay declared once in the Struct schema.
 * Each call borrows `CurrentForm` and returns Scope-owned render work.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundMaskedInput<Fields extends FormFields> {
  /**
   * Creates a bound text input using the selected field's bidirectional string codec.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <const Options extends object, const Host extends HostResult = never>(
    options: SchemaBoundMaskedInputOptions<Fields> & Options,
    host?: Dom.HostOverride<Dom.HostProps<HTMLInputElement>, "", Host>,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable schema-bound checkbox constructor.
 * @remarks
 * Only boolean field names are accepted and state comes from `CurrentForm`.
 * Each call returns Scope-owned DOM work and borrows the current form state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundCheckbox<Values extends object> {
  /**
   * Creates a bound native checkbox for a boolean field.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <const Options extends object, const Host extends HostResult = never>(
    options: SchemaBoundCheckboxOptions<Values> & Options,
    host?: Dom.HostOverride<Dom.RenderHostProps<Options, CheckboxProps<Values>>, "", Host>,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable schema-bound native select constructor.
 * @remarks
 * String field names are inferred while option content remains caller-authored.
 * Each call returns Scope-owned DOM/content work and borrows current form state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundSelect<Values extends object> {
  /**
   * Creates a bound native select and preserves caller-authored option content.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <const Options extends object, const Host extends HostResult = never>(
    options: SchemaBoundSelectOptions<Values> & Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, SelectProps<Values>>,
      (SchemaBoundSelectOptions<Values> & Options)["content"],
      Host
    >,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable schema-bound field-error constructor.
 * @remarks
 * Field error text and relationship IDs derive from the current form automatically.
 * Each call returns a Scope-owned subscription and borrows current form state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundError<Values extends object> {
  /**
   * Creates a bound alert region for one field's current error.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <const Options extends object, const Host extends HostResult = never>(
    options: SchemaBoundErrorOptions<Values> & Options,
    host?: Dom.HostOverride<Dom.RenderHostProps<Options, ErrorProps<Values>>, Renderable.Any, Host>,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable schema-bound reset-button constructor.
 * @remarks
 * Reset behavior can access the current form without a state argument.
 * Each call returns Scope-owned DOM work and borrows current form state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundReset {
  /**
   * Creates a reset button targeting the form provided by `CurrentForm`.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <const Options extends object, const Host extends HostResult = never>(
    options: SchemaBoundResetOptions & Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, ResetProps<object>>,
      (SchemaBoundResetOptions & Options)["content"],
      Host
    >,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable schema-bound array append-button constructor.
 * @remarks
 * Field and item types are derived from the form value.
 * Each call returns Scope-owned DOM work and borrows current form state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundPush<Values extends object> {
  /**
   * Creates an append button for a type-compatible array field and item.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <
    const Name extends ArrayFieldName<Values>,
    const Options extends object,
    const Host extends HostResult = never,
  >(
    options: SchemaBoundPushOptions<Values, Name> & Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, PushProps<Values, Name>>,
      (SchemaBoundPushOptions<Values, Name> & Options)["content"],
      Host
    >,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable schema-bound array removal-button constructor.
 * @remarks
 * Array fields remain type-checked without passing state explicitly.
 * Each call returns Scope-owned DOM work and borrows current form state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundRemove<Values extends object> {
  /**
   * Creates a remove button for an array field and explicit item index.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <
    const Name extends ArrayFieldName<Values>,
    const Options extends object,
    const Host extends HostResult = never,
  >(
    options: SchemaBoundRemoveOptions<Values, Name> & Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, RemoveProps<Values, Name>>,
      (SchemaBoundRemoveOptions<Values, Name> & Options)["content"],
      Host
    >,
  ): SchemaBoundComponentResult<Options, Host>;
}

/**
 * Callable root constructor supplied by a schema-bound form API.
 * @remarks
 * It connects one factory-created state to native form behavior and descendant context.
 * The returned Fx provides `CurrentForm` for its own Scope and borrows the state.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundRoot<Values extends object> {
  /**
   * Creates the native form root that provides its `form` state to bound descendants.
   * @since 1.0.0
   * @category Schema-bound components
   */
  <
    E,
    R,
    const Options extends BoundFormOptions<Values, E, R>,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<Dom.HostProps<HTMLFormElement>, Options["content"], Host>,
  ): SchemaBoundRootResult<Options, Host>;
}

/**
 * Optional state metadata for `SchemaBoundForm.state`.
 * @remarks
 * Callers may seed SSR identity, defaults, errors, and interaction/submission state.
 * Values/defaults and nested references are retained exactly; provide `id` for
 * deterministic SSR identity.
 * @since 1.0.0
 * @category Component options
 */
export interface SchemaBoundStateOptions<Values extends object> {
  /**
   * Stable hydration and accessibility relationship ID; required for deterministic SSR ordering.
   */
  readonly id?: string;
  /**
   * Exact reset-baseline reference, defaulting to the same object passed as initial values.
   */
  readonly defaultValues?: Values;
  /**
   * Initial field validation messages.
   */
  readonly errors?: Partial<Record<keyof Values & string, string>>;
  /**
   * Initial dirty/touched metadata.
   */
  readonly meta?: Partial<Record<keyof Values & string, FieldMeta>>;
  /**
   * Whether validation or the returned submit Effect is running.
   */
  readonly submitting?: boolean;
}

/**
 * Schema-specialized form API returned by `make`.
 * @remarks
 * The Struct codec is declared once, then every state, field name, component,
 * error, and custom-host signature stays aligned with it.
 * The API retains the codec but acquires no Scope. Each `state` call creates a
 * Scope-owned hydrated RefSubject; each component call creates lazy Fx output.
 * @since 1.0.0
 * @category Schema-bound components
 */
export interface SchemaBoundForm<Fields extends FormFields> {
  /**
   * Struct codec shared by state construction and every bound field.
   */
  readonly codec: Schema.Struct<Fields>;
  /**
   * Creates a Scope-owned hydrated state from decoded initial values.
   */
  readonly state: (
    values: Schema.Struct.Type<Fields>,
    options?: SchemaBoundStateOptions<Schema.Struct.Type<Fields>>,
  ) => Effect.Effect<FormState<Schema.Struct.Type<Fields>>, Schema.SchemaError, Scope.Scope>;
  /**
   * Native form root that provides the current state to bound descendants.
   */
  readonly Root: SchemaBoundRoot<Schema.Struct.Type<Fields>>;
  /**
   * Bound native text input for string-encoded string fields.
   */
  readonly TextInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native search input for string-encoded string fields.
   */
  readonly SearchInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native email input for string-encoded string fields.
   */
  readonly EmailInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native URL input for string-encoded string fields.
   */
  readonly UrlInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native telephone input for string-encoded string fields.
   */
  readonly TelInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native password input for string-encoded string fields.
   */
  readonly PasswordInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native hidden input for string-encoded string fields.
   */
  readonly HiddenInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native color input for string-encoded string fields.
   */
  readonly ColorInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native time input for string-encoded string fields.
   */
  readonly TimeInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native local date-time input for string-encoded string fields.
   */
  readonly DateTimeLocalInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native month input for string-encoded string fields.
   */
  readonly MonthInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native week input for string-encoded string fields.
   */
  readonly WeekInput: SchemaBoundInput<Fields, string>;
  /**
   * Bound native number input for finite-number fields encoded as strings.
   */
  readonly NumberInput: SchemaBoundInput<Fields, number>;
  /**
   * Bound native range input for finite-number fields encoded as strings.
   */
  readonly RangeInput: SchemaBoundInput<Fields, number>;
  /**
   * Bound native date input for Date fields encoded as strings.
   */
  readonly DateInput: SchemaBoundInput<Fields, Date>;
  /**
   * Bound text input using the selected field's own string codec.
   */
  readonly MaskedInput: SchemaBoundMaskedInput<Fields>;
  /**
   * Bound native checkbox limited to boolean fields.
   */
  readonly Checkbox: SchemaBoundCheckbox<Schema.Struct.Type<Fields>>;
  /**
   * Bound native select limited to string fields.
   */
  readonly Select: SchemaBoundSelect<Schema.Struct.Type<Fields>>;
  /**
   * Bound ARIA alert for a field's current validation message.
   */
  readonly Error: SchemaBoundError<Schema.Struct.Type<Fields>>;
  /**
   * Bound reset button that restores the current form's defaults.
   */
  readonly Reset: SchemaBoundReset;
  /**
   * Bound button that appends to an array field.
   */
  readonly Push: SchemaBoundPush<Schema.Struct.Type<Fields>>;
  /**
   * Bound button that removes an item from an array field.
   */
  readonly Remove: SchemaBoundRemove<Schema.Struct.Type<Fields>>;
  /**
   * Native label component; callers provide the target control ID.
   */
  readonly Label: typeof Label;
  /**
   * Neutral description host for caller-linked explanatory content.
   */
  readonly Description: typeof Description;
  /**
   * Native submit button.
   */
  readonly Submit: typeof Submit;
  /**
   * Accessible group host for related controls.
   */
  readonly Group: typeof Group;
}

/**
 * Binds a native form component family to one Struct codec.
 *
 * @remarks
 * state accepts decoded defaults and allocates a Scope-owned hydrated subject. Root provides
 * that form through CurrentForm. Bound controls select compatible field names from both decoded
 * and encoded schema types; their context requirement remains in the Fx until Root provides it.
 * Use explicit stable IDs when server rendering and hydrating.
 *
 * @example
 * ```ts
 * import { Schema } from "effect";
 * import { html } from "@typed/template";
 * import { RefSubject } from "@typed/fx";
 * import { component } from "@typed/ui/Component";
 * import * as Form from "@typed/ui/Form";
 *
 * const Order = Form.make(Schema.Struct({
 *   copies: Schema.FiniteFromString.pipe(Schema.check(Schema.isGreaterThan(0))),
 *   includeNotes: Schema.Boolean,
 * }));
 *
 * export const PrintOrder = component(function* () {
 *   const form = yield* Order.state({ copies: 1, includeNotes: false }, { id: "print-order" });
 *   const submitting = RefSubject.map(form, (state) => state.submitting);
 *   const preview = yield* RefSubject.make("No print request preview yet.");
 *   return html`<section>${Order.Root({
 *     form,
 *     content: [
 *       Order.Label({ for: "order-copies", content: "Copies" }),
 *       Order.NumberInput({ name: "copies", props: { id: "order-copies", min: 1, required: true } }),
 *       Order.Error({ name: "copies" }),
 *       Order.Checkbox({ name: "includeNotes", props: { id: "order-notes" } }),
 *       Order.Label({ for: "order-notes", content: "Include speaker notes" }),
 *       Order.Submit({ content: "Preview print request", props: { "?disabled": submitting } }),
 *       Order.Reset({ content: "Restore defaults" }),
 *     ],
 *     onValidSubmit: (values) => RefSubject.set(
 *       preview,
 *       `${values.copies} copies; notes ${values.includeNotes ? "included" : "excluded"}.`,
 *     ),
 *   })}<p role="status">${preview}</p></section>`;
 * });
 * ```
 * @since 1.0.0
 * @category Schema-bound components
 */
export function make<const Fields extends FormFields>(
  codec: Schema.Struct<Fields>,
): SchemaBoundForm<Fields> {
  type Values = Schema.Struct.Type<Fields>;

  const state = (values: Values, options: SchemaBoundStateOptions<Values> = {}) =>
    makeState(codec, { ...options, values } as InitialStateFor<Fields>);

  const Root = <
    E,
    R,
    const Options extends BoundFormOptions<Values, E, R>,
    const Host extends HostResult = never,
  >(
    options: Options & Pick<BoundFormOptions<Values, E, R>, "form" | "content">,
    host?: Dom.HostOverride<Dom.HostProps<HTMLFormElement>, Options["content"], Host>,
  ) => {
    const { form, ...rootOptions } = options;
    return Form(
      { ...rootOptions, state: form } as Omit<Options, "form"> & {
        readonly state: FormState<Values>;
      },
      host as never,
    );
  };

  const BoundCheckbox = <
    const Options extends SchemaBoundCheckboxOptions<Values>,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<Dom.RenderHostProps<Options, CheckboxProps<Values>>, "", Host>,
  ) =>
    withCurrentForm<Values>()((state) => {
      const inputOptions = { ...options, state } as Options & {
        readonly state: FormState<Values>;
      };
      return Checkbox<Values, typeof inputOptions, Host>(inputOptions, host as never);
    });

  const BoundSelect = <
    const Options extends SchemaBoundSelectOptions<Values>,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, SelectProps<Values>>,
      Options["content"],
      Host
    >,
  ) =>
    withCurrentForm<Values>()((state) => {
      const inputOptions = { ...options, state } as Options & {
        readonly state: FormState<Values>;
      };
      return Select<Values, typeof inputOptions, Host>(inputOptions, host as never);
    });

  const BoundError = <
    const Options extends SchemaBoundErrorOptions<Values>,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<Dom.RenderHostProps<Options, ErrorProps<Values>>, Renderable.Any, Host>,
  ) =>
    withCurrentForm<Values>()((state) => {
      const inputOptions = { ...options, state } as Options & {
        readonly state: FormState<Values>;
      };
      return Error<Values, typeof inputOptions, Host>(inputOptions, host as never);
    });

  const BoundReset = <
    const Options extends SchemaBoundResetOptions,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, ResetProps<Values>>,
      Options["content"],
      Host
    >,
  ) =>
    withCurrentForm<Values>()((state) => {
      const inputOptions = { ...options, state } as Options & {
        readonly state: FormState<Values>;
      };
      return Reset<Values, typeof inputOptions, Host>(inputOptions, host as never);
    });

  const BoundPush = <
    const Name extends ArrayFieldName<Values>,
    const Options extends SchemaBoundPushOptions<Values, Name>,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, PushProps<Values, Name>>,
      Options["content"],
      Host
    >,
  ) =>
    withCurrentForm<Values>()((state) => {
      const inputOptions = { ...options, state } as Options & {
        readonly state: FormState<Values>;
      };
      return Push<Values, Name, typeof inputOptions, Host>(inputOptions, host as never);
    });

  const BoundRemove = <
    const Name extends ArrayFieldName<Values>,
    const Options extends SchemaBoundRemoveOptions<Values, Name>,
    const Host extends HostResult = never,
  >(
    options: Options,
    host?: Dom.HostOverride<
      Dom.RenderHostProps<Options, RemoveProps<Values, Name>>,
      Options["content"],
      Host
    >,
  ) =>
    withCurrentForm<Values>()((state) => {
      const inputOptions = { ...options, state } as Options & {
        readonly state: FormState<Values>;
      };
      return Remove<Values, Name, typeof inputOptions, Host>(inputOptions, host as never);
    });

  return {
    codec,
    state,
    Root,
    TextInput: makeSchemaBoundInput<Fields, string>(codec, "text"),
    SearchInput: makeSchemaBoundInput<Fields, string>(codec, "search"),
    EmailInput: makeSchemaBoundInput<Fields, string>(codec, "email"),
    UrlInput: makeSchemaBoundInput<Fields, string>(codec, "url"),
    TelInput: makeSchemaBoundInput<Fields, string>(codec, "tel"),
    PasswordInput: makeSchemaBoundInput<Fields, string>(codec, "password"),
    HiddenInput: makeSchemaBoundInput<Fields, string>(codec, "hidden"),
    ColorInput: makeSchemaBoundInput<Fields, string>(codec, "color"),
    TimeInput: makeSchemaBoundInput<Fields, string>(codec, "time"),
    DateTimeLocalInput: makeSchemaBoundInput<Fields, string>(codec, "datetime-local"),
    MonthInput: makeSchemaBoundInput<Fields, string>(codec, "month"),
    WeekInput: makeSchemaBoundInput<Fields, string>(codec, "week"),
    NumberInput: makeSchemaBoundInput<Fields, number>(codec, "number"),
    RangeInput: makeSchemaBoundInput<Fields, number>(codec, "range"),
    DateInput: makeSchemaBoundInput<Fields, Date>(codec, "date"),
    MaskedInput: makeSchemaBoundInput<Fields, unknown>(codec, "text"),
    Checkbox: BoundCheckbox,
    Select: BoundSelect,
    Error: BoundError,
    Reset: BoundReset,
    Push: BoundPush,
    Remove: BoundRemove,
    Label,
    Description,
    Submit,
    Group,
  } as unknown as SchemaBoundForm<Fields>;
}
