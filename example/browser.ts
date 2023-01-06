/// <reference types="@typed/vite-plugin" />

import * as Fx from '@typed/fx'
import { render } from 'virtual:browser-entry:./pages'

const parentElement = document.getElementById('application')

if (!parentElement) {
  throw new Error('Could not find #application element')
}

Fx.unsafeRunAsync(render(parentElement))
