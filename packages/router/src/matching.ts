/**
 * パスマッチングユーティリティ
 */

/** パスパターンからパラメータ名を抽出 */
export function extractParamNames(pattern: string): string[] {
  const matches = pattern.match(/:([^/]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/** パスパターンを正規表現に変換 */
export function patternToRegex(pattern: string): RegExp {
  if (pattern === "*") {
    return /.*/;
  }
  // まず :param を一時的なプレースホルダーに置き換え
  // その後、正規表現の特殊文字をエスケープ
  // 最後にプレースホルダーをキャプチャグループに置換
  const placeholder = "___PARAM___";

  // パラメータをプレースホルダーに置換
  const withPlaceholders = pattern.replace(/:([^/]+)/g, placeholder);

  // 正規表現の特殊文字をエスケープ
  const escaped = withPlaceholders.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // プレースホルダーをキャプチャグループに置換
  const regexStr = escaped.replace(new RegExp(placeholder, "g"), "([^/]+)");

  return new RegExp(`^${regexStr}$`);
}

/** クエリ文字列をパース */
export function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  if (search.startsWith("?")) {
    search = search.slice(1);
  }
  if (search) {
    for (const pair of search.split("&")) {
      const [key, value] = pair.split("=");
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }
  }
  return query;
}

/** パスがパターンにマッチするか確認し、パラメータを抽出 */
export function matchPath(
  path: string,
  pattern: string,
): { match: boolean; params: Record<string, string> } {
  const regex = patternToRegex(pattern);
  const match = path.match(regex);

  if (!match) {
    return { match: false, params: {} };
  }

  const paramNames = extractParamNames(pattern);
  const params: Record<string, string> = {};

  for (let i = 0; i < paramNames.length; i++) {
    params[paramNames[i]] = match[i + 1] || "";
  }

  return { match: true, params };
}
