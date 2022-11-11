export type Database = {
  dbname: string
  lastSample: {
    countClassName: string
    nbQueries: string
    topFiveQueries: readonly [Query, ...Query[]]
  }
}

export type Query = {
  dbname: string
  elapsedClassName: string
  formatElapsed: string
  query: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  export const ENV: {
    timeout: number
    generateData(): { toArray(): ReadonlyArray<Database> }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  export const Monitoring: {
    renderRate: { ping(): void }
  }
}
