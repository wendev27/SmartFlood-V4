"use client";

import { createContext, useContext } from "react";

export type DashboardPresentationView = "notifications" | "weatherForecast" | "emergencyReports";
export interface DashboardPresentationNavigation {
  view: DashboardPresentationView | null;
  open: (view: DashboardPresentationView) => void;
}

/** Local presentation navigation only. V3.2's authorized route list remains authoritative. */
export const DashboardPresentationContext = createContext<DashboardPresentationNavigation | null>(null);
export const useDashboardPresentation = () => useContext(DashboardPresentationContext);
