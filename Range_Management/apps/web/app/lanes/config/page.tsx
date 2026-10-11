"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CameraConfigDark } from "@/components/config/CameraConfigDark";
import { CameraConfigLight } from "@/components/config/CameraConfigLight";
import { useTheme } from "@/contexts/theme-context";

export default function CameraConfigPage() {
  const { resolvedTheme } = useTheme();

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <CameraConfigLight />
      ) : (
        <CameraConfigDark />
      )}
    </DashboardLayout>
  );
}
