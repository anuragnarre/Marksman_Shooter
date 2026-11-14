"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, CreditCard, Activity, Tag, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/toast-context";

interface LedgerTx {
  id: string;
  user: string;
  type: string;
  amount: string;
  provider: "STRIPE" | "RAZORPAY";
  status: "SUCCESS" | "FAILED";
}

interface PromoCode {
  code: string;
  discount: string;
  active: boolean;
}

const INITIAL_TRANSACTIONS: LedgerTx[] = [
  { id: "TRX-8120", user: "Michael T.", type: "Membership Renewal", amount: "$150.00", provider: "STRIPE", status: "SUCCESS" },
  { id: "TRX-8119", user: "Sarah L.", type: "Coaching Package (10)", amount: "$500.00", provider: "STRIPE", status: "SUCCESS" },
  { id: "TRX-8118", user: "Rahul K.", type: "Competition Entry", amount: "Rs.1,500.00", provider: "RAZORPAY", status: "SUCCESS" },
  { id: "TRX-8117", user: "John D.", type: "Monthly Membership", amount: "$150.00", provider: "STRIPE", status: "FAILED" },
];

const INITIAL_PROMOS: PromoCode[] = [
  { code: "OPENRANGE15", discount: "15% OFF", active: true },
  { code: "COACHPRO25", discount: "25% OFF", active: true },
  { code: "JUNIORACADEMY", discount: "50% OFF", active: false },
];

// Financial Dashboard for RANGE_ADMIN
export default function FinancialDashboard() {
  const { toast } = useToast();
  const [providerFilter, setProviderFilter] = useState<"ALL" | "STRIPE" | "RAZORPAY">("ALL");
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("10% OFF");

  const visibleTransactions = INITIAL_TRANSACTIONS.filter((t) =>
    providerFilter === "ALL" ? true : t.provider === providerFilter
  );

  const handleExportLedger = () => {
    const rows = [
      ["Transaction ID", "Member", "Description", "Amount", "Provider", "Status"],
      ...visibleTransactions.map((t) => [t.id, t.user, t.type, t.amount, t.provider, t.status]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marksman-ledger-${providerFilter.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${visibleTransactions.length} ledger transactions (.CSV)`, "success");
  };

  const handleGenerateTaxReport = () => {
    const content = [
      "MARKSMAN RANGE MANAGEMENT - TAX SUMMARY REPORT",
      `Generated: ${new Date().toISOString()}`,
      "==================================================",
      "Gross Monthly Revenue:     $52,480.00",
      "Memberships (65%):         $34,112.00",
      "Coaching Packages (20%):   $10,496.00",
      "Day Passes & Retail (10%): $5,248.00",
      "Competition Fees (5%):     $2,624.00",
      "Active Subscriptions:      412",
      "Failed / Pending Retries:  14",
      "==================================================",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "marksman-tax-report.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast("Tax report generated & downloaded (.TXT)", "success");
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newPromoCode.trim().toUpperCase();
    if (!cleaned) return;
    setPromos((prev) => [{ code: cleaned, discount: newPromoDiscount.trim() || "10% OFF", active: true }, ...prev]);
    setNewPromoCode("");
    toast(`Promo code ${cleaned} created`, "success");
  };

  const togglePromo = (code: string) => {
    setPromos((prev) => prev.map((p) => (p.code === code ? { ...p, active: !p.active } : p)));
  };

  return (
    <DashboardLayout role="RANGE_ADMIN" showBack pageTitle="Financials & Billing">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-on-surface tracking-tight">Financial &amp; Billing</h1>
            <p className="text-on-surface-variant mt-1 sm:mt-2 text-sm sm:text-lg">Revenue KPIs, ledger overview, and tax reporting.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExportLedger}
              variant="outline"
              className="border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl font-bold"
            >
              <Download size={18} className="mr-2" /> Export Ledger
            </Button>
            <Button
              onClick={handleGenerateTaxReport}
              className="bg-[#4CAF50] text-white hover:bg-[#388E3C] shadow-md rounded-xl font-bold"
            >
              <FileText size={18} className="mr-2" /> Generate Tax Report
            </Button>
          </div>
        </div>

        {/* Revenue KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-2xl">
                <DollarSign size={22} className="text-primary" />
              </div>
              <span className="text-[11px] font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +15.4%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Monthly Revenue</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-on-surface">$52,480</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-tertiary/10 p-2.5 sm:p-3 rounded-2xl">
                <Activity size={22} className="text-tertiary" />
              </div>
              <span className="text-[11px] font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +2.1%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Subscriptions</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-on-surface">412</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-[#FF9800]/10 p-2.5 sm:p-3 rounded-2xl">
                <CreditCard size={22} className="text-[#FF9800]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg Revenue / Member</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-on-surface">$127.30</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-[#FF5252]/10 p-2.5 sm:p-3 rounded-2xl">
                <TrendingDown size={22} className="text-[#FF5252]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#FF5252] uppercase tracking-wider mb-1">Failed Payments</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-[#FF5252]">14</p>
              <p className="text-[11px] text-on-surface-variant mt-1">Pending Retry / Grace Period</p>
            </div>
          </div>
        </div>

        {/* Ledger & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Recent Transactions
              </h3>
              <div className="flex gap-2">
                {(["ALL", "STRIPE", "RAZORPAY"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={providerFilter === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProviderFilter(p)}
                    className="rounded-xl border-outline-variant/50 text-xs"
                  >
                    {p === "ALL" ? "All" : p === "STRIPE" ? "Stripe" : "Razorpay"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {visibleTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex flex-wrap justify-between items-center gap-3 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-mono text-xs sm:text-sm text-on-surface-variant">{trx.id}</span>
                    <div>
                      <p className="font-bold text-on-surface text-sm sm:text-lg">{trx.user}</p>
                      <p className="text-xs sm:text-sm text-on-surface-variant">{trx.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="font-bold text-base sm:text-xl">{trx.amount}</span>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                          trx.status === "SUCCESS"
                            ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                            : "bg-[#FF5252]/10 text-[#FF5252]"
                        }`}
                      >
                        {trx.status}
                      </span>
                      <span className="text-[10px] text-on-surface-variant uppercase mt-1">{trx.provider}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-6">Revenue Breakdown</h3>

            <div className="space-y-6 flex-1">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-on-surface-variant">Memberships</span>
                  <span className="font-bold text-on-surface">65%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: "65%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-on-surface-variant">Coaching Packages</span>
                  <span className="font-bold text-on-surface">20%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-3">
                  <div className="bg-tertiary h-3 rounded-full" style={{ width: "20%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-on-surface-variant">Day Passes &amp; Retail</span>
                  <span className="font-bold text-on-surface">10%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-3">
                  <div className="bg-[#FF9800] h-3 rounded-full" style={{ width: "10%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-on-surface-variant">Competition Fees</span>
                  <span className="font-bold text-on-surface">5%</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-3">
                  <div className="bg-secondary h-3 rounded-full" style={{ width: "5%" }} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/20">
              <Button
                variant="outline"
                onClick={() => setPromoModalOpen(true)}
                className="w-full text-base sm:text-lg font-bold py-5 rounded-2xl border-outline-variant/50 hover:bg-surface-container-high"
              >
                <Tag size={18} className="mr-2" /> Manage Promo Codes ({promos.filter((p) => p.active).length} Active)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Codes Modal */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPromoModalOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant/40 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-on-surface uppercase tracking-wide">
                Facility Promo Codes
              </h3>
              <button type="button" onClick={() => setPromoModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPromo} className="flex gap-2">
              <input
                type="text"
                placeholder="NEWCODE20"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value)}
                className="flex-1 rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="20% OFF"
                value={newPromoDiscount}
                onChange={(e) => setNewPromoDiscount(e.target.value)}
                className="w-24 rounded-xl bg-surface-container border border-outline-variant/40 px-2.5 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" className="rounded-xl">
                <Plus size={16} />
              </Button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {promos.map((p) => (
                <div
                  key={p.code}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-on-surface">{p.code}</span>
                    <span className="ml-2 text-xs font-semibold text-primary">{p.discount}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePromo(p.code)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      p.active ? "bg-[#4CAF50]/15 text-[#4CAF50]" : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {p.active ? "Active" : "Paused"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
