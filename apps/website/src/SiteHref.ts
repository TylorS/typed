const baseUrl =
  import.meta.env?.BASE_URL ??
  (typeof process === "undefined" ? "/typed/" : (process.env.SITE_BASE ?? "/typed/"));
const basePath = baseUrl.replace(/\/$/u, "");

/** Builds a same-site URL that also works when the documentation is deployed below a subpath. */
export const siteHref = (path: string, base = basePath): string => {
  const end = path.search(/[?#]/u);
  const pathname = end < 0 ? path : path.slice(0, end);
  const suffix = end < 0 ? "" : path.slice(end);
  const page = pathname.startsWith("/reference/") || !/\.[^/]+$/u.test(pathname);
  return `${base.replace(/\/$/u, "")}${pathname}${page && !pathname.endsWith("/") ? "/" : ""}${suffix}`;
};
