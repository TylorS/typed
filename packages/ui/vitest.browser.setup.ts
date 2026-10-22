import { beforeEach } from "vitest";

// Focus Vitest's test iframe before exercising native focus and blur handlers.
beforeEach(() => window.focus());
