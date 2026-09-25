"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MembersDark } from "@/components/memberships/MembersDark";
import { MembersLight } from "@/components/memberships/MembersLight";
import { useTheme } from "@/contexts/theme-context";
import { useMemberships } from "@/hooks/useMemberships";

export default function MembershipsPage() {
  const { resolvedTheme } = useTheme();
  const membershipsData = useMemberships();

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <MembersLight {...membershipsData} />
      ) : (
        <MembersDark {...membershipsData} />
      )}
    </DashboardLayout>
  );
}
