import type { Scope } from '@effect/io/Scope'
import type { DomServices } from '@typed/dom'
import type { RenderContext } from '@typed/html'
import type { Navigation } from '@typed/navigation'
import type { Router } from '@typed/router'

/**
 * The core of the framework is the IntrinsicServices. IntrinsicServices are
 * all of the DOM services provided by @typed/dom, the router provided by
 * @typed/router, and the RenderContext provided by @typed/html.
 *
 * With these services we provide all of the capabilities of our vite plugin.
 */
export type IntrinsicServices = DomServices | Storage | Navigation | Router | RenderContext | Scope
