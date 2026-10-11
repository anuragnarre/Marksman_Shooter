"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SafetyDark } from "@/components/safety/SafetyDark";
import { SafetyLight } from "@/components/safety/SafetyLight";
import { useTheme } from "@/contexts/theme-context";
import { useSafety } from "@/hooks/useSafety";

export default function SafetyPage() {
  const { resolvedTheme } = useTheme();
  const safetyData = useSafety();

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <SafetyLight {...safetyData} />
      ) : (
        <SafetyDark {...safetyData} />
      )}
    </DashboardLayout>
  );
}
