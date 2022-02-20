import { Option } from '../Option'
import { Progress } from '../Progress'

export interface Refreshing<A> {
  readonly type: 'Refereshing'
  readonly value: A
  readonly progress: Option<Progress>
}
