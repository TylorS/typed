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
 *    - How to handle 404 / redirects? .fallback.ts ?
 *    - How to support incremental static rendering?
 *       - Redis client backed Ref ??
 *    - How to order routes?
 *    - compile-time transposition in templates?
 *    - linting/type-checking templates better
 *    - Recommend usage of no-implicit-globals eslint config (maybe publish an eslint config?)
 *    - How to organize and construct layouts?
 *      - !!Ensure layouts are not remounted during route changes!!
 *    - Consider microfrontend use cases
 *    - Consider islands architecture
 *      - How to handle extracting static portions of the app?
 *    - Mounting a React app
 */