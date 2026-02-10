/**
 * Path matching utilities
 */

/** Extract dynamic parameter names from a route pattern (e.g. ":id" -> "id") */
export function extractParamNames(pattern: string): string[] {
  const matches = pattern.match(/:([^/]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/** Convert a route pattern string into a RegExp for path matching */
export function patternToRegex(pattern: string): RegExp {
  if (pattern === "*") {
    return /.*/;
  }
  // First replace :param segments with a temporary placeholder,
  // then escape regex special characters,
  // finally replace placeholders with capture groups.
  const placeholder = "___PARAM___";

  // Replace parameters with placeholders
  const withPlaceholders = pattern.replace(/:([^/]+)/g, placeholder);

  // Escape regex special characters
  const escaped = withPlaceholders.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Replace placeholders with capture groups
  const regexStr = escaped.replace(new RegExp(placeholder, "g"), "([^/]+)");

  return new RegExp(`^${regexStr}$`);
}

/** Parse a query string (with or without leading "?") into a key-value record */
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

/** Match a path against a pattern, returning whether it matched and any extracted parameters */
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
