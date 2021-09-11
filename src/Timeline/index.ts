import { Time } from '@/Clock'

export class Timeline<A> {
  private readonly timeSlots: Array<TimeSlot<A>>

  constructor() {
    this.timeSlots = []
  }

  readonly nextArrival = (): Time => {
    return this.isEmpty() ? Time(Infinity) : this.timeSlots[0].time
  }

  readonly isEmpty = (): boolean => {
    return this.timeSlots.length === 0
  }

  readonly add = (time: Time, a: A): void => {
    insertByTime(time, a, this.timeSlots)
  }

  readonly remove = (time: Time, a: A): boolean => {
    const i = binarySearch(time, this.timeSlots)

    if (i >= 0 && i < this.timeSlots.length) {
      const events = this.timeSlots[i].events
      const at = events.findIndex((x) => x === a)

      if (at >= 0) {
        events.splice(at, 1)

        if (events.length === 0) {
          this.timeSlots.splice(i, 1)
        }

        return true
      }
    }

    return false
  }

  readonly getReadyTasks = (t: Time): readonly A[] => {
    const tasks = this.timeSlots
    const l = tasks.length
    let i = 0

    while (i < l && tasks[i].time <= t) {
      ++i
    }

    return this.timeSlots.splice(0, i).flatMap((x) => x.events)
  }
}

interface TimeSlot<A> {
  readonly time: Time
  readonly events: A[]
}

function insertByTime<A>(time: Time, a: A, timeslots: Array<TimeSlot<A>>): void {
  const l = timeslots.length

  if (l === 0) {
    timeslots.push(makeTimeslot(time, [a]))

    return
  }

  const i = binarySearch(time, timeslots)

  if (i >= l) {
    timeslots.push(makeTimeslot(time, [a]))
  } else {
    insertAtTimeslot(a, timeslots, time, i)
  }
}

function insertAtTimeslot<A>(task: A, timeslots: Array<TimeSlot<A>>, time: Time, i: number): void {
  const timeslot = timeslots[i]

  if (time === timeslot.time) {
    timeslot.events.push(task)
  } else {
    timeslots.splice(i, 0, makeTimeslot(time, [task]))
  }
}

function binarySearch<A>(t: Time, sortedArray: ArrayLike<TimeSlot<A>>): number {
  let lo = 0
  let hi = sortedArray.length
  let mid, y

  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2)
    y = sortedArray[mid]

    if (t === y.time) {
      return mid
    } else if (t < y.time) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  return hi
}

const makeTimeslot = <A>(t: Time, events: A[]): TimeSlot<A> => ({
  time: t,
  events: events,
})
