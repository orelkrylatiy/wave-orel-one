/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIGACHAT_CLIENT_ID: string;
  readonly VITE_GIGACHAT_AUTH_KEY: string;
  readonly VITE_GIGACHAT_SCOPE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
