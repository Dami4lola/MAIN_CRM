import { useCallback, useEffect, useState } from "react";

export type OfficePage = "dispatch" | "jobs" | "clients" | "team" | "messages" | "reports" | "settings";
export type TechPage = "jobs" | "schedule";

/**
 * The URL decides who is signed in and what they see, so each role can be
 * opened in its own window: #/office/jobs, #/tech/marcus/jobs, #/portal/harbourview.
 * #/book is the public online booking page customers use; it needs no sign-in.
 */
export type Route =
  | { area: "signin" }
  | { area: "book" }
  | { area: "office"; page: OfficePage; clientId?: string }
  | { area: "tech"; techId: string; page: TechPage }
  | { area: "portal"; clientId: string };

const OFFICE_PAGES: OfficePage[] = ["dispatch", "jobs", "clients", "team", "messages", "reports", "settings"];

export function parseHash(hash: string): Route {
  const [area, first, second] = hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  if (area === "office") {
    const page = OFFICE_PAGES.includes(first as OfficePage) ? (first as OfficePage) : "dispatch";
    return page === "clients" && second ? { area, page, clientId: second } : { area, page };
  }
  if (area === "tech" && first) return { area, techId: first, page: second === "schedule" ? "schedule" : "jobs" };
  if (area === "portal" && first) return { area, clientId: first };
  if (area === "book") return { area };
  return { area: "signin" };
}

export function routeHash(route: Route) {
  const parts: string[] =
    route.area === "office"
      ? ["office", route.page, ...(route.clientId ? [route.clientId] : [])]
      : route.area === "tech"
        ? ["tech", route.techId, route.page]
        : route.area === "portal"
          ? ["portal", route.clientId]
          : route.area === "book"
            ? ["book"]
            : [];
  return `#/${parts.map(encodeURIComponent).join("/")}`;
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = routeHash(next);
  }, []);

  return [route, navigate] as const;
}
