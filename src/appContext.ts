import { createContext, useContext } from "react";
import type { Scope } from "./data/access";
import type { CrmStore } from "./data/store";
import type { Client, Crew, Job, Role, Site, Technician } from "./data/types";
import type { Route } from "./router";

export type AppContextValue = {
  store: CrmStore;
  role: Role;
  search: string;
  isOffice: boolean;
  /** The technician signed in, for the tech role. */
  currentTech: Technician | undefined;
  /** The commercial account signed in, for the client portal. */
  currentClient: Client | undefined;
  /** Records this role may see (see data/access.ts). */
  scope: Scope;
  visibleJobs: Job[];
  notify: (message: string) => void;
  money: (amount: number) => string;
  client: (id: string) => Client | undefined;
  site: (id: string) => Site | undefined;
  crew: (id: string | null) => Crew | undefined;
  tech: (id: string) => Technician | undefined;
  crewMembers: (crewId: string | null) => Technician[];
  jobMatchesSearch: (job: Job) => boolean;
  navigate: (route: Route) => void;
  openJob: (id: string) => void;
  openClient: (id: string) => void;
  newJob: (clientId?: string) => void;
  editJob: (id: string) => void;
  removeJob: (id: string) => void;
  advanceJob: (id: string) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppContext");
  return value;
}
