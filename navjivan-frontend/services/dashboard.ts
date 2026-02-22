
import API from "./api";

export interface DashboardSummary {
  streakDays?: number;

  today?: {
    cigarettesAvoided?: number;
    moneySaved?: number;
    dailyLimit?: number;
    goalsCompleted?: number;
    totalGoals?: number;
    cravingsHandled?: number;
  };

  totals?: {
    cigarettesAvoided?: number;
    moneySaved?: number;
    relapses?: number;
  };

  hotspots?: {
    count?: number;
  };

  planType?: string;
}

export async function fetchDashboardSummary() {
  const res = await API.get<DashboardSummary>("/dashboard/summary");
  return res.data;
}
