# excalibur-vite template

```bash
npm install
npm run dev
```

Project Structure:

- My preference is to use Excalibur with the global `ex` variable rather than importing all the time, so i've set that up (see `src/globals`)
- Assets go in `public` and then added to `src/assets.ts` as an Excalibur resource.
- actors go in `src/actors`, scenes in `src/scenes`, etc. We can make these folders up as we go.

Other Notes:

- tsconfig rules are pretty lax, strict mode is off but I enabled strictNullChecks
- `src` is configured as an import alias, so `import { assets } from 'src/assets'` works
- prettier is setup just for IDE formatting on save. Not enforced, but we can change the formatting rules
