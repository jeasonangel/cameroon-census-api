/// <reference types="vite/client" />

// Optionally augment `ImportMetaEnv` with known VITE_ variables:
// interface ImportMetaEnv {
//   readonly VITE_API_BASE?: string;
// }

// If you need to customize more, uncomment and add fields above.
// frontend/src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_API_URL: string;
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
