export type HtmlChunk = TextChunk | PartChunk | SparsePartChunk

export class TextChunk {
  readonly _tag = "text" as const

  constructor(readonly text: string) {}
}

export class PartChunk {
  readonly _tag = "part" as const

  constructor(
    readonly index: number,
    public render: (value: string | null | undefined) => string
  ) {}
}

export abstract class SparsePartChunk {
  readonly _tag = "sparsePart" as const

  private _values: Map<number, string> = new Map()
  private _expected: number

  constructor(
    readonly parts: ReadonlyArray<PartChunk | TextChunk>,
    readonly render: (value: string) => void,
    readonly separator: string
  ) {
    this._expected = parts.length

    parts.forEach((part, index) => {
      if (part._tag === "text") {
        this._values.set(index, part.text)
      } else {
        const original = part.render.bind(part)
        part.render = (value) => {
          const x = original(value)
          this._values.set(index, x)
          if (this.shouldEmit()) {
            this.emit()
          }
          return x
        }
      }
    })

    if (this.shouldEmit()) {
      this.emit()
    }
  }

  private shouldEmit() {
    return this._values.size === this._expected
  }

  private emit() {
    this.render(
      Array.from({ length: this._expected }, (_, index) => this._values.get(index)!).join(this.separator)
    )
  }
}
