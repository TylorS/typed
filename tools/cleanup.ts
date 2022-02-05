import { join } from 'path'
import rimraf from 'rimraf'

import { ROOT_DIR } from './common'

rimraf.sync(join(ROOT_DIR, 'cjs'))
rimraf.sync(join(ROOT_DIR, 'esm'))
