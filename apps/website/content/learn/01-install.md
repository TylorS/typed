---
id: "install"
title: "Create the project"
summary: "Start a TypeScript project and install Typed."
order: 1
---

Create a Vite TypeScript project, install Typed, and start the development server:

```sh file="terminal"
npm create vite@latest typed-counter -- --template vanilla-ts
cd typed-counter
npm install --save-exact effect@4.0.0-rc.112 @typed/fx@2.0.0-beta.7 @typed/template@1.0.0-beta.7 @typed/ui@1.0.0-beta.7
npm run dev
```

Keep the starter's `package.json` and `index.html`. Add the two files below.
