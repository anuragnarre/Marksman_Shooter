"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { CommandCenterDark } from "@/components/dashboard/CommandCenterDark";
import { CommandCenterLight } from "@/components/dashboard/CommandCenterLight";
import { useTheme } from "@/contexts/theme-context";

export default function OperatorDashboard() {
  const [rangeStatus, setRangeStatus] = useState<"HOT" | "COLD">("HOT");
  const [rangeId, setRangeId] = useState<string | null>(null);
  const [lanes, setLanes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranges = await apiFetch('/ranges') as any[];
        if (ranges && ranges.length > 0) {
          const id = ranges[0].id;
          setRangeId(id);
          
          const dashboardStats = await apiFetch<any>(`/range-operations/${id}/dashboard-stats`);
          setRangeStatus(dashboardStats.rangeStatus || "HOT");

          const fetchedLanes = await apiFetch<any[]>(`/range-operations/${id}/lanes`);
          setLanes(fetchedLanes);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleStatus = async () => {
    if (isLoading) return;
    const newStatus = rangeStatus === "HOT" ? "COLD" : "HOT";
    try {
      setRangeStatus(newStatus); // Optimistic
      if (rangeId) {
        await apiFetch(`/range-operations/${rangeId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
      setRangeStatus(rangeStatus); // Revert
    }
  };

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === 'light' ? (
        <CommandCenterLight 
          rangeStatus={rangeStatus} 
          lanes={lanes} 
          isLoading={isLoading} 
          onToggleStatus={handleToggleStatus} 
        />
      ) : (
        <CommandCenterDark 
          rangeStatus={rangeStatus} 
          lanes={lanes} 
          isLoading={isLoading} 
          onToggleStatus={handleToggleStatus} 
        />
      )}
    </DashboardLayout>
  );
}
