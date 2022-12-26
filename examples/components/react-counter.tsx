import * as React from 'react'

export interface CounterProps {
  readonly name: string
}

export const Counter = (props: CounterProps) => {
  const [count, setCount] = React.useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Incrrement</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>

      <p>
        {props.name}: {count}
      </p>
    </div>
  )
}
