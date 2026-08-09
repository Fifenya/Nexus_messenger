/// <reference types="vite/client" />

// Если у вас есть кастомные переменные окружения (например, VITE_API_URL),
// можно явно описать их типы здесь, чтобы не было ошибок:
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Добавьте сюда другие VITE_ переменные, если они появятся
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
