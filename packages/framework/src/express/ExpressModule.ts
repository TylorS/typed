import type { Router } from 'express'

export interface ExpressModule {
  readonly router: Router
}
