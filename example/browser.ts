import { unsafeRunAsync } from '@typed/fx'
import { render } from '@typed/vite-plugin/browser'

const parentElement = document.getElementById('application')

if (!parentElement) {
  throw new Error('Could not find #application element')
}

unsafeRunAsync(render(parentElement))
