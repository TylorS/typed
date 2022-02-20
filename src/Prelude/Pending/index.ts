import { None, Option } from '../Option'
import { Progress } from '../Progress'

export interface Pending {
  readonly type: 'Pending'
  readonly progress: Option<Progress>
}

export const Pending = (progress: Option<Progress> = None): Pending => ({
  type: 'Pending',
  progress,
})
