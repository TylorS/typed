import type { Meta, StoryObj } from "@typed/storybook"
import { Link } from "@typed/ui"

type Args = {
  to: string
  label: string
}

const meta = {
  component: Link
} satisfies Meta<Args>

export default meta

type Story = StoryObj<Args, typeof meta>

export const Example: Story = {
  render: (args) => Link({ to: args.to }, args.label),
  args: {
    to: "/foo",
    label: "Hello, World!"
  }
}
