import "vitest/browser";
declare module "vitest/browser" {
  interface BrowserCommands {
    renderSvelteFixture(scenario: string, label: string): Promise<{ html: string; head?: string }>;
  }
}
