import { Destination, NavigationEvent } from './Navigation.js'

export type NavigationEventJson = {
  readonly [K in keyof NavigationEvent]: NavigationEvent[K] extends Destination
    ? DestinationJson
    : NavigationEvent[K]
}

type DestinationJson = {
  readonly [K in keyof Destination]: Destination[K] extends URL ? string : Destination[K]
}

export const decodeDestination = (d: DestinationJson): Destination => ({
  ...d,
  url: new URL(d.url),
})

export const decodeNavigationEvent = (event: NavigationEventJson): NavigationEvent => ({
  ...event,
  destination: decodeDestination(event.destination),
})

export const encodeEvent = (event: NavigationEvent): NavigationEventJson => ({
  ...event,
  destination: encodeDestination(event.destination),
})

export const encodeDestination = (destination: Destination): DestinationJson => ({
  ...destination,
  url: destination.url.href,
})
