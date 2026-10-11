"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, CreditCard, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Financial Dashboard for RANGE_ADMIN
export default function FinancialDashboard() {
  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 h-full overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Financial & Billing</h1>
            <p className="text-on-surface-variant mt-2 text-lg">Revenue KPIs, ledger overview, and tax reporting.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl font-bold">
              <Download size={18} className="mr-2" /> Export Ledger
            </Button>
            <Button className="bg-[#4CAF50] text-white hover:bg-[#388E3C] shadow-md rounded-xl font-bold">
              <FileText size={18} className="mr-2" /> Generate Tax Report
            </Button>
          </div>
        </div>

        {/* Revenue KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <DollarSign size={24} className="text-primary" />
              </div>
              <span className="text-xs font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-1 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +15.4%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Monthly Revenue</p>
              <p className="text-4xl font-display font-bold text-on-surface">$52,480</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-tertiary/10 p-3 rounded-2xl">
                <Activity size={24} className="text-tertiary" />
              </div>
              <span className="text-xs font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-1 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +2.1%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Subscriptions</p>
              <p className="text-4xl font-display font-bold text-on-surface">412</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#FF9800]/10 p-3 rounded-2xl">
                <CreditCard size={24} className="text-[#FF9800]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg Revenue / Member</p>
              <p className="text-4xl font-display font-bold text-on-surface">$127.30</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#FF5252]/10 p-3 rounded-2xl">
                <TrendingDown size={24} className="text-[#FF5252]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#FF5252] uppercase tracking-wider mb-1">Failed Payments</p>
              <p className="text-4xl font-display font-bold text-[#FF5252]">14</p>
              <p className="text-xs text-on-surface-variant mt-1">Pending Retry / Grace Period</p>
            </div>
          </div>
        </div>

        {/* Ledger & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" /> Recent Transactions
                </h3>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="rounded-xl border-outline-variant/50">All</Button>
                   <Button variant="outline" size="sm" className="rounded-xl border-outline-variant/50">Stripe</Button>
                   <Button variant="outline" size="sm" className="rounded-xl border-outline-variant/50">Razorpay</Button>
                </div>
             </div>
             <div className="space-y-4">
               {[
                 { id: "TRX-8120", user: "Michael T.", type: "Membership Renewal", amount: "$150.00", provider: "STRIPE", status: "SUCCESS" },
                 { id: "TRX-8119", user: "Sarah L.", type: "Coaching Package (10)", amount: "$500.00", provider: "STRIPE", status: "SUCCESS" },
                 { id: "TRX-8118", user: "Rahul K.", type: "Competition Entry", amount: "₹1,500.00", provider: "RAZORPAY", status: "SUCCESS" },
                 { id: "TRX-8117", user: "John D.", type: "Monthly Membership", amount: "$150.00", provider: "STRIPE", status: "FAILED" },
               ].map((trx, idx) => (
                 <div key={idx} className="flex justify-between items-center p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                   <div className="flex items-center gap-4">
                     <span className="font-mono text-sm text-on-surface-variant">{trx.id}</span>
                     <div>
                       <p className="font-bold text-on-surface text-lg">{trx.user}</p>
                       <p className="text-sm text-on-surface-variant">{trx.type}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                     <span className="font-bold text-xl">{trx.amount}</span>
                     <div className="flex flex-col items-end">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                         trx.status === 'SUCCESS' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' : 'bg-[#FF5252]/10 text-[#FF5252]'
                       }`}>
                         {trx.status}
                       </span>
                       <span className="text-[10px] text-on-surface-variant uppercase mt-1">{trx.provider}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col">
             <h3 className="text-xl font-bold text-on-surface mb-6">Revenue Breakdown</h3>
             
             <div className="space-y-6 flex-1">
                <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-on-surface-variant">Memberships</span>
                     <span className="font-bold text-on-surface">65%</span>
                   </div>
                   <div className="w-full bg-surface-container-high rounded-full h-3">
                     <div className="bg-primary h-3 rounded-full" style={{ width: '65%' }}></div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-on-surface-variant">Coaching Packages</span>
                     <span className="font-bold text-on-surface">20%</span>
                   </div>
                   <div className="w-full bg-surface-container-high rounded-full h-3">
                     <div className="bg-tertiary h-3 rounded-full" style={{ width: '20%' }}></div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-on-surface-variant">Day Passes & Retail</span>
                     <span className="font-bold text-on-surface">10%</span>
                   </div>
                   <div className="w-full bg-surface-container-high rounded-full h-3">
                     <div className="bg-[#FF9800] h-3 rounded-full" style={{ width: '10%' }}></div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-on-surface-variant">Competition Fees</span>
                     <span className="font-bold text-on-surface">5%</span>
                   </div>
                   <div className="w-full bg-surface-container-high rounded-full h-3">
                     <div className="bg-secondary h-3 rounded-full" style={{ width: '5%' }}></div>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-outline-variant/20">
                <Button variant="outline" className="w-full text-lg font-bold py-6 rounded-2xl border-outline-variant/50 hover:bg-surface-container-high">
                  Manage Promo Codes
                </Button>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
