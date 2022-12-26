/**
 * !!Allow modifying the entrypoint and expanding the Intrinsic Services!!
 * TODOS:
 * - Static analysis of your templates to determine the querySelectors to wait for server-side
 * - Static analysis of your files to determine the routes
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
 *    - How to support incremental static rendering?
 *       - Redis client backed Ref ??
 *    - compile-time transposition in templates?
 *    - linting/type-checking templates better
 *    - Recommend usage of no-implicit-globals eslint config (maybe publish an eslint config?)
 *    - Consider islands architecture w/ SSR
 *      - If we can determine which portions of the application is dynamic, we can separate it out
 *    - Mounting a React app
 */
