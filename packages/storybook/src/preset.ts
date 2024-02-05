import type { PresetProperty } from "@storybook/types"
import type { StorybookConfig } from "./types"

export const addons: PresetProperty<"addons"> = []

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

export const previewAnnotations: PresetProperty<"previewAnnotations"> = (
  entry: Array<string>
) => {
  return entry
}

export const viteFinal: StorybookConfig["viteFinal"] = async (baseConfig, _options) => {
  // const { options: {} } = await options.presets.apply<{ options: FrameworkOptions }>(
  //   "frameworkOptions"
  // )

  return baseConfig
}

export { renderToCanvas } from "./renderToCanvas.js"
