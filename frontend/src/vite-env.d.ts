/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SQUARE_APPLICATION_ID?: string;
  readonly VITE_SQUARE_LOCATION_ID?: string;
  /** sandbox (default) | production — URL do script do Web Payments SDK */
  readonly VITE_SQUARE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
