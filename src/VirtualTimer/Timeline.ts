import { Arity1 } from '@typed/lambda'
import { ordNumber } from 'fp-ts/es6/Ord'
import { sort } from 'fp-ts/es6/ReadonlyArray'

const sortNumbers = sort(ordNumber)

/**
 * Timeline is responsible for storing tasks at a given time and
 * returns what tasks are ready at the current time.
 */
export class Timeline {
  private tasks: Map<number, Arity1<number>[]> = new Map()

  public addTask = (time: number, f: Arity1<number>) => {
    const tasksAtTime = this.tasks.get(time) || []

    tasksAtTime.push(f)

    this.tasks.set(time, tasksAtTime)
  }

  public removeTask = (time: number, f: Arity1<number>) => {
    const tasksAtTime = this.tasks.get(time)

    if (!tasksAtTime) {
      return
    }

    const index = tasksAtTime.findIndex((x) => x === f)

    if (index > -1) {
      tasksAtTime.splice(index, 1)
    }

    if (tasksAtTime.length === 0) {
      this.tasks.delete(time)
    }
  }

  public readyTasks = (currentTime: number) => {
    const times = Array.from(this.tasks.keys())
    const timesToRun = sortNumbers(times.filter((x) => x <= currentTime))

    return timesToRun.flatMap(this.getAndDelete)
  }

  private getAndDelete = (time: number) => {
    const tasks = this.tasks.get(time)! || []

    this.tasks.delete(time)

    return tasks
  }
}
