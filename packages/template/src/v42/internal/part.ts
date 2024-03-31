import * as Equal from "effect/Equal"
import * as Option from "effect/Option"
import { isNotNullable } from "effect/Predicate"

export abstract class Part<A> {
  abstract readonly _tag: string

  protected _value: Option.Option<A> = Option.none()

  constructor(readonly index: number) {}

  fromUnkown(u: unknown): A {
    return u as A
  }

  abstract setValue(value: A): void

  update(input: unknown): boolean {
    const value = this.fromUnkown(input)
    if (Option.isNone(this._value) || !Equal.equals(this._value.value, value)) {
      this._value = Option.some(value)
      this.setValue(value)
      return true
    } else {
      return false
    }
  }
}

export namespace Part {
  export type Any = Part<any>

  export type Value<T> = T extends Part<infer A> ? A : T extends StaticPart<infer A> ? A : never
}

export class StringPart<T extends string> extends Part<string | undefined | null> {
  constructor(readonly _tag: T, readonly index: number, readonly setValue: (value: string | undefined | null) => void) {
    super(index)
  }

  fromUnkown(u: unknown): string | undefined | null {
    switch (typeof u) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "symbol":
        return String(u)
      case "undefined":
        return u as undefined
      case "function":
      case "object":
        return u === null ? null : unexpected(`Unexpected "${typeof u}" value`)
    }
  }
}

const unexpected = (message: string) => {
  throw new TypeError(message)
}

export class UnknownPart<T extends string> extends Part<unknown> {
  constructor(readonly _tag: T, readonly index: number, readonly setValue: (value: unknown) => void) {
    super(index)
  }
}

export class BooleanPart<T extends string> extends Part<boolean> {
  constructor(readonly _tag: T, readonly index: number, readonly setValue: (value: boolean) => void) {
    super(index)
  }

  fromUnkown(u: unknown): boolean {
    return !!u
  }
}

export class StaticPart<A> {
  readonly _tag = "Static" as const
  constructor(readonly value: A) {}
}

export abstract class PartGroup<T extends string, Parts extends ReadonlyArray<Part<any> | StaticPart<any>>, A> {
  private _values: Map<number, Part.Value<Parts[number]>> = new Map()
  private _expected: number
  private _current: Option.Option<A> = Option.none()

  constructor(readonly _tag: T, readonly parts: Parts) {
    this._expected = parts.length

    parts.forEach((part, index) => {
      if (part instanceof StaticPart) {
        this._values.set(index, part.value)
      } else {
        part.setValue = (value) => {
          this._values.set(index, value)
          if (this.shouldEmit()) {
            this.emit()
          }
        }
      }
    })

    if (this.shouldEmit()) {
      this.emit()
    }
  }

  protected abstract prepare(values: { readonly [K in keyof Parts]: Part.Value<Parts[K]> }): A

  protected abstract setValue(value: A): void

  private shouldEmit() {
    return this._values.size === this._expected
  }

  private emit() {
    const values = Array.from({ length: this._expected }, (_, index) => this._values.get(index)!) as {
      readonly [K in keyof Parts]: Part.Value<Parts[K]>
    }
    const value = this.prepare(values)

    if (Option.isNone(this._current) || (Option.isSome(this._current) && !Equal.equals(this._current.value, value))) {
      this._current = Option.some(value)
      this.setValue(value)
    }
  }
}

export namespace PartGroup {
  export type Any = PartGroup<any, ReadonlyArray<Part<any> | StaticPart<any>>, any>

  export type Value<T> = [T] extends [PartGroup<infer _, infer _Parts, infer A>] ? A : never
}

export class StringPartGroup<
  T extends string,
  Parts extends ReadonlyArray<Part<string | null | undefined> | StaticPart<string>>
> extends PartGroup<T, Parts, string> {
  constructor(tag: T, parts: Parts, readonly separator: string, readonly setValue: (value: string) => void) {
    super(tag, parts)
  }

  prepare(values: { readonly [K in keyof Parts]: Part.Value<Parts[K]> }): string {
    return values.filter(isNotNullable).join(this.separator)
  }
}
