---
"@typed/template": patch
---

Fork interpolated template values synchronously.

This allows avoiding setTimeout between each nested template,
to allow data to begin loading as soon as possible concurrently.
