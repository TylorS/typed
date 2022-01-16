export class MutableRef<A> {
  private state: A

  constructor(readonly initial: A) {
    this.state = initial
  }

  static make = <A>(initial: A) => new MutableRef(initial)

  readonly get = () => this.state

  readonly set = (value: A) => {
    return (this.state = value)
  }

  readonly reset = () => {
    return (this.state = this.initial)
  }
}
