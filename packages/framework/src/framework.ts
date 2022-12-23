/**
 * TODOS:
 * - Static ananlysis of your templates to determine the querySelectors to wait for server-side
 * - Static analysis of your files to determine the routes
 * - Static analysis of your files to determine the main for each environment
 * - Dynamic runtime for doing all of this within an ESM environment for development
 *    - SSR
 *    - CSR
 *    - HMR
 * - Static code generator
 *    - SSR
 *    - CSR
 *    - Type Checking generated output for production builds
 *    - Preview servers
 * - Things to think about
 *    - How to order routes?
 *    - compile-time transposition in templates?
 *    - linting/type-checking templates better
 *    - Recommend usage of no-implicit-globals eslint config (maybe publish an eslint config?)
 *    - How to organize and construct layouts
 *    - Consider microfrontend use cases
 *      - Only allow globalThis.Node to be returned to the Router?
 *    - Islands architecture
 */

import { DomServices } from '@typed/dom'
import { RenderContext } from '@typed/html'
import { Router } from '@typed/router'

export type IntrinsicServices = DomServices | Router | RenderContext
