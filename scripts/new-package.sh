#!/usr/bin/env bash

node ./scripts/new-package/new-package.js --name $1 # Generate the new package
pnpm run sync-refs                                  # Sync typescript references
pnpm run update-paths                               # Sync paths configurations
pnpm i
