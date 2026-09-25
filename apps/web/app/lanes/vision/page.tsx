"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { LiveVisionDark } from "@/components/vision/LiveVisionDark";
import { LiveVisionLight } from "@/components/vision/LiveVisionLight";
import { useTheme } from "@/contexts/theme-context";

export default function LanesVisionPage() {
  const { resolvedTheme } = useTheme();

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <LiveVisionLight />
      ) : (
        <LiveVisionDark />
      )}
    </DashboardLayout>
  );
}
