"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PaymentsDark } from "@/components/payments/PaymentsDark";
import { PaymentsLight } from "@/components/payments/PaymentsLight";
import { useTheme } from "@/contexts/theme-context";
import { usePayments } from "@/hooks/usePayments";

export default function PaymentsPage() {
  const { resolvedTheme } = useTheme();
  const paymentsData = usePayments();

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <PaymentsLight {...paymentsData} />
      ) : (
        <PaymentsDark {...paymentsData} />
      )}
    </DashboardLayout>
  );
}
