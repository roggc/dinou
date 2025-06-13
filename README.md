# **dinou**: Minimal React 19 Framework

dinou is a React 19 framework. dinou means 19 in catalan.

- You can create an npm project by yourself (`npm init -y`),

- Install dependencies (`npm i react react-dom dinou`)

- Create scripts in `package.json`:

  - "dev": "dinou dev"

  - "build": "dinou build"

  - "start": "dinou start"

  - "eject": "dinou eject"

- Create an `src` folder with a `page.jsx` (or `.tsx`, `.js`)

  ```typescript
  "use client";

  export default function Page() {
    return <>hi world!</>;
  }
  ```

- Run `npm run dev` to see the page in action in your browser.

- If you run `npm run eject`, dinou will be ejected and copied to your root project folder, so you can customize it.

- Or you can just run **`npx create-dinou@latest my-app`** to have an app ready to be developed with dinou.
