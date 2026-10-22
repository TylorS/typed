const baseUrl =
  import.meta.env?.BASE_URL ??
  (typeof process === "undefined" ? "/typed/" : (process.env.SITE_BASE ?? "/typed/"));
const basePath = baseUrl.replace(/\/$/u, "");

/** Builds a same-site URL that also works when the documentation is deployed below a subpath. */
export const siteHref = (path: string, base = basePath): string => {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const prefix = base.replace(/\/$/u, "");
  const end = path.search(/[?#]/u);
  const pathname = end < 0 ? path : path.slice(0, end);
  const localPath =
    prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))
      ? pathname.slice(prefix.length)
      : pathname;
  const suffix = end < 0 ? "" : path.slice(end);
  const page = localPath.startsWith("/reference/") || !/\.[^/]+$/u.test(localPath);
  return `${prefix}${localPath}${page && !localPath.endsWith("/") ? "/" : ""}${suffix}`;
};
