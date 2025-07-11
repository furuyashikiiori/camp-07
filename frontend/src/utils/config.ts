// 環境に応じたURL設定

// API のベースURL取得
export const getApiBaseUrl = (): string => {
  // 環境変数から取得（優先）
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // 開発環境のデフォルト
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }

  // 本番環境のデフォルト
  return "https://qrsona-backend.onrender.com";
};

// アプリケーションのベースURL取得
export const getAppBaseUrl = (): string => {
  // 環境変数から取得
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 開発環境のデフォルト
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // ブラウザ環境での動的URL決定
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // ポート番号がある場合は含める
    const portSuffix =
      port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${protocol}//${hostname}${portSuffix}`;
  }

  // SSR環境でのデフォルト
  return "https://qrsona.vercel.app";
};

// 完全なAPI URLを構築
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return endpoint.startsWith("/")
    ? `${baseUrl}${endpoint}`
    : `${baseUrl}/${endpoint}`;
};
