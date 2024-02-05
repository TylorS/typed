/**
 * Storybook preset for Typed projects.
 * @since 1.0.0
 */

import type { PresetProperty } from "@storybook/types"
import type { StorybookConfig } from "./types"

/**
 * @since 1.0.0
 */
export const addons: PresetProperty<"addons"> = []

/**
 * @since 1.0.0
 */
export const core: PresetProperty<"core"> = async (config, options) => {
  const framework = await options.presets.apply("framework")

  return {
    ...config,
    builder: {
      name: "@storybook/builder-vite",
      options: {
        ...(typeof framework === "string" ? {} : framework.options.builder || {})
      }
    },
    renderer: "@typed/storybook"
  }
}

/**
 * @since 1.0.0
 */
export const previewAnnotations: PresetProperty<"previewAnnotations"> = (
  entry: Array<string>
) => {
  return entry
}

/**
 * @since 1.0.0
 */
export const viteFinal: StorybookConfig["viteFinal"] = async (baseConfig, _options) => {
  // const { options: {} } = await options.presets.apply<{ options: FrameworkOptions }>(
  //   "frameworkOptions"
  // )

  return baseConfig
}

export {
  /**
   * @since 1.0.0
   */
  renderToCanvas
} from "./renderToCanvas.js"
