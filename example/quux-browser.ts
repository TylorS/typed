/// <reference types="@typed/framework" />

import * as Fx from '@typed/fx'
import { render } from 'browser:./quux-pages'

const parentElement = document.getElementById('application')

if (!parentElement) {
  throw new Error('Could not find #application element')
}

Fx.unsafeRunAsync(render(parentElement))
