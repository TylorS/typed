---
"@typed/guard": patch
---

Optimize multiple calls to the Guard produced by Guard.any({...})
by getting the Guard instance only once at the time of creation.
