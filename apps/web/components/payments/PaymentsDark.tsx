import React from 'react';

export function PaymentsDark({ billingHistory = [], subscriptionPlans = [], currentPlan = null, totalRevenue = 0, pendingAmount = 0, overdueAmount = 0, isLoading = false, error = null, refetch = () => {} }: any) {
  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full">
{/* Operational Sub-Header Bar */}
<div className="flex flex-col md:flex-row md:items-center justify-between pb-space-lg gap-space-md">
<div className="flex flex-col">
<div className="flex items-center gap-space-sm">
<span className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Payments, POS &amp; Session Invoicing</span>
<span className="px-space-sm py-0.5 rounded bg-primary/10 text-primary font-label-caps text-label-caps">ARMORY TERMINAL #01</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-1">Live station register, match fees, equipment hire, and automated armory billing.</p>
</div>
<div className="flex items-center gap-space-md self-start md:self-auto">
{/* Currency / Register Mode Switcher */}
<div className="flex items-center bg-surface-container-low p-1 rounded-lg">
<button className="px-space-md py-1 rounded bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase shadow-sm" type="button">USD ($)</button>
<button className="px-space-md py-1 rounded text-on-surface-variant hover:text-on-surface font-label-caps text-label-caps uppercase transition-colors" type="button">EUR (€)</button>
<button className="px-space-md py-1 rounded text-on-surface-variant hover:text-on-surface font-label-caps text-label-caps uppercase transition-colors" type="button">GBP (£)</button>
</div>
{/* Quick Action: Walk-in Drawer Trigger */}
<button className="flex items-center gap-space-xs px-space-lg py-2 rounded-lg bg-primary text-on-primary font-headline-md text-body-md hover:bg-primary-fixed-dim transition-all shadow-md active:scale-95" type="button">
<span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
<span>+ Open New Bill / Walk-in</span>
</button>
</div>
</div>
{/* Top Metric Cards (4 Cards) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-space-lg">
{/* Card 1: Gross Revenue */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden group">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Daily Gross Revenue</span>
<span className="material-symbols-outlined text-primary text-[18px]">payments</span>
</div>
<div className="my-space-xs flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold tracking-tight">$1,845.50</span>
<span className="inline-flex items-center gap-0.5 text-tertiary font-label-caps text-label-caps bg-tertiary/10 px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px]">trending_up</span>+14%
        </span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>Target $2,200.00</span>
<span className="font-telemetry-sm text-outline">83% Shift Run</span>
</div>
</div>
{/* Card 2: Active Unbilled */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden group">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary" />
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Active Unbilled Sessions</span>
<span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
</div>
<div className="my-space-xs flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold tracking-tight">03 Lanes</span>
<span className="inline-flex items-center text-secondary font-label-caps text-label-caps bg-secondary-container/20 px-1.5 py-0.5 rounded">Action Needed</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>Bays 04, 11, 19 Active</span>
<span className="font-telemetry-sm text-outline">Est. $118.00 Pending</span>
</div>
</div>
{/* Card 3: PCP Air Refill */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden group">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-tertiary" />
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">PCP Air Refill Station</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">compress</span>
</div>
<div className="my-space-xs flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold tracking-tight">$240.00</span>
<span className="font-telemetry-sm text-tertiary">30 Fills Logged</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>Bank A: 300 BAR (Full)</span>
<span className="font-telemetry-sm text-outline">B: 240 BAR</span>
</div>
</div>
{/* Card 4: Retail & Ammo */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden group">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-fixed-dim" />
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Retail &amp; Ammo Depot</span>
<span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
</div>
<div className="my-space-xs flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold tracking-tight">$465.00</span>
<span className="font-telemetry-sm text-primary">31 Tins Sold</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>JSB .177 Heavy #1</span>
<span className="font-telemetry-sm text-outline">H&amp;N Barracuda #2</span>
</div>
</div>
</div>
{/* Main Grid Split (60% Transactions Table / 40% Live Active Terminal) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
{/* Left Panel: 60% Width (7/12 grid cols) */}
<div className="lg:col-span-7 flex flex-col gap-space-md">
{/* Search, Queue Filter & Barcode scanner */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md shadow-sm">
<div className="relative w-full sm:w-80">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
<input className="w-full pl-9 pr-space-md py-1.5 rounded-lg bg-surface-container text-on-surface placeholder:text-outline-variant font-body-sm text-body-sm outline-none focus:bg-surface-container-high transition-colors" placeholder="Search by shooter, invoice #, bay or RFID..." type="text"/>
</div>
<div className="flex items-center gap-space-xs w-full sm:w-auto justify-end">
<button className="flex items-center gap-1 px-space-md py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-caps font-label-caps transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">tune</span>
<span>FILTER</span>
</button>
<button className="flex items-center gap-1 px-space-md py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-label-caps font-label-caps transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">barcode_scanner</span>
<span>SCAN</span>
</button>
<button className="flex items-center gap-1 px-space-md py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-tertiary text-label-caps font-label-caps transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">refresh</span>
<span>LIVE</span>
</button>
</div>
</div>
{/* Transactions & Invoice Queue Table */}
<div className="bg-surface-container-low rounded-xl shadow-sm overflow-hidden flex flex-col">
<div className="px-space-lg py-space-md bg-surface-container-lowest flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="font-headline-md text-body-md text-on-surface">Live Session Register</span>
<span className="px-2 py-0.5 rounded-full bg-surface-container text-outline font-label-caps text-label-caps">14 TODAY</span>
</div>
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">AUTO-UPDATED 10S AGO</span>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-high/40 text-outline font-label-caps text-label-caps uppercase">
<th className="py-space-sm px-space-md">Invoice #</th>
<th className="py-space-sm px-space-md">Shooter / Member</th>
<th className="py-space-sm px-space-md">Lane &amp; Duration</th>
<th className="py-space-sm px-space-md">Equipment / Add-ons</th>
<th className="py-space-sm px-space-md text-right">Total</th>
<th className="py-space-sm px-space-md text-center">Status</th>
<th className="py-space-sm px-space-md text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y-0 text-body-sm font-body-sm">
          {isLoading ? (
            <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-label-caps">Loading transactions...</td></tr>
          ) : billingHistory.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-label-caps">No transactions found.</td></tr>
          ) : (
            billingHistory.map((record: any) => (
              <tr key={record.id} className={`hover:bg-surface-container transition-colors cursor-pointer group ${record.status === 'PENDING' ? 'bg-primary/5 hover:bg-primary/10' : record.status === 'OVERDUE' ? 'bg-error/5 hover:bg-error/10' : ''}`}>
                <td className="py-space-md px-space-md font-telemetry-sm text-primary font-bold">#{record.id}</td>
                <td className="py-space-md px-space-md text-on-surface">
                  <span className="font-semibold">{record.memberName || 'Unknown'}</span>
                </td>
                <td className="py-space-md px-space-md text-on-surface-variant font-telemetry-sm text-telemetry-sm">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="py-space-md px-space-md text-on-surface">
                  {record.description}
                </td>
                <td className="py-space-md px-space-md text-on-surface-variant font-telemetry-sm text-telemetry-sm">
                  {record.method || 'N/A'}
                </td>
                <td className="py-space-md px-space-md">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps font-bold uppercase ${
                    record.status === 'PAID' ? 'bg-tertiary/20 text-tertiary' :
                    record.status === 'PENDING' ? 'bg-primary-container/30 text-primary' :
                    record.status === 'OVERDUE' ? 'bg-error/20 text-error' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="py-space-md px-space-md text-right">
                  <span className={`font-telemetry-sm text-telemetry-sm font-bold ${record.status === 'OVERDUE' ? 'text-error' : 'text-on-surface'}`}>
                    ${record.amount.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))
          )}
</tbody>
</table>
</div>
</div>
{/* Quick Add Armory / Depot POS Tile Keys */}
<div className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Armory Fast-Add POS Keys</span>
<span className="font-label-caps text-label-caps text-primary">CLICK TO PUSH TO ACTIVE INVOICE</span>
</div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-left flex flex-col justify-between transition-colors group" type="button">
<span className="material-symbols-outlined text-tertiary text-[20px] mb-1">compress</span>
<span className="font-headline-md text-body-sm text-on-surface leading-tight">PCP Air Fill</span>
<span className="font-telemetry-sm text-primary font-bold mt-1">$8.00</span>
</button>
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-left flex flex-col justify-between transition-colors group" type="button">
<span className="material-symbols-outlined text-primary text-[20px] mb-1">adjust</span>
<span className="font-headline-md text-body-sm text-on-surface leading-tight">JSB Exact Pellets</span>
<span className="font-telemetry-sm text-primary font-bold mt-1">$16.50</span>
</button>
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-left flex flex-col justify-between transition-colors group" type="button">
<span className="material-symbols-outlined text-secondary text-[20px] mb-1">headphones</span>
<span className="font-headline-md text-body-sm text-on-surface leading-tight">Ear Pro Loaner</span>
<span className="font-telemetry-sm text-primary font-bold mt-1">$4.00</span>
</button>
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-left flex flex-col justify-between transition-colors group" type="button">
<span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px] mb-1">speed</span>
<span className="font-headline-md text-body-sm text-on-surface leading-tight">Chrono Test</span>
<span className="font-telemetry-sm text-primary font-bold mt-1">$10.00</span>
</button>
</div>
</div>
</div>
{/* Right Panel: 40% Width (5/12 grid cols) Point-of-Sale Checkout Panel */}
<div className="lg:col-span-5 bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
{/* Active Invoice Header */}
<div className="flex items-start justify-between pb-space-sm bg-surface-container p-space-md rounded-lg">
<div className="flex items-center gap-space-md">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">person</span>
</div>
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-on-surface font-bold">Sarah Jenkins</span>
<span className="font-label-caps text-label-caps text-tertiary">LANE 04 • WALK-IN SHOOTER (WAIVER VERIFIED)</span>
</div>
</div>
<span className="px-2 py-1 rounded bg-secondary/10 text-secondary font-label-caps text-label-caps uppercase font-bold">#INV-8902</span>
</div>
{/* Itemized Ledger */}
<div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-md rounded-lg">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider mb-space-xs">Itemized Range Ledger</span>
<div className="flex items-center justify-between py-1 text-body-sm">
<div className="flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-primary" />
<span className="text-on-surface font-medium">60 Min Range Lane Fee</span>
</div>
<span className="font-telemetry-sm text-on-surface">$25.00</span>
</div>
<div className="flex items-center justify-between py-1 text-body-sm">
<div className="flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
<span className="text-on-surface font-medium">Club Airgun Rental (Air Venturi PCP)</span>
</div>
<span className="font-telemetry-sm text-on-surface">$12.00</span>
</div>
<div className="flex items-center justify-between py-1 text-body-sm">
<div className="flex items-center gap-2">
<span className="w-1.5 h-1.5 rounded-full bg-outline" />
<span className="text-on-surface font-medium">Target Paper Roll (10-Ring 10m ISSF)</span>
</div>
<span className="font-telemetry-sm text-on-surface">$5.50</span>
</div>
<div className="mt-space-sm pt-space-sm bg-surface-container/30 px-space-sm rounded flex flex-col gap-1">
<div className="flex items-center justify-between text-body-sm text-on-surface-variant">
<span>Subtotal</span>
<span className="font-telemetry-sm text-on-surface font-medium">$42.50</span>
</div>
<div className="flex items-center justify-between text-body-sm text-on-surface-variant">
<span>State Range Tax (8%)</span>
<span className="font-telemetry-sm text-on-surface font-medium">$3.40</span>
</div>
</div>
</div>
{/* Total Balance Due Banner */}
<div className="p-space-md rounded-xl bg-surface-container-highest flex items-center justify-between shadow-inner">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Total Balance Due</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Includes equipment deposit release</span>
</div>
<div className="text-right">
<span className="font-telemetry-lg text-telemetry-lg text-primary font-extrabold tracking-tight">$45.90</span>
</div>
</div>
{/* Tender Selection Grid */}
<div className="flex flex-col gap-space-xs">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Select Tender Mode</span>
<div className="grid grid-cols-2 gap-space-sm">
<button className="p-space-md rounded-lg bg-primary-container text-on-primary-container font-headline-md text-body-md flex items-center justify-center gap-space-xs shadow-md" type="button">
<span className="material-symbols-outlined text-[20px]">credit_card</span>
<span>Credit / Debit</span>
</button>
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-md text-body-md flex items-center justify-center gap-space-xs transition-colors" type="button">
<span className="material-symbols-outlined text-[20px]">point_of_sale</span>
<span>Cash Drawer</span>
</button>
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-md text-body-md flex items-center justify-center gap-space-xs transition-colors" type="button">
<span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
<span>Member Balance</span>
</button>
<button className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-md text-body-md flex items-center justify-center gap-space-xs transition-colors" type="button">
<span className="material-symbols-outlined text-[20px]">contactless</span>
<span>Digital Tap</span>
</button>
</div>
</div>
{/* Main Payment Processing Button */}
<button className="w-full py-3 rounded-xl bg-primary text-on-primary font-headline-xl text-headline-md uppercase tracking-wide hover:bg-primary-fixed-dim transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-space-sm" type="button">
<span className="material-symbols-outlined text-[22px]">check_circle</span>
<span>Process Payment ($45.90)</span>
</button>
{/* Auxiliary Bottom Post-Payment Controls */}
<div className="flex items-center gap-space-sm pt-space-xs">
<button className="flex-1 py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase flex items-center justify-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">receipt_long</span>
<span>Thermal Receipt</span>
</button>
<button className="flex-1 py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase flex items-center justify-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">mail</span>
<span>Email Scorecard</span>
</button>
<button className="py-2 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-label-caps text-label-caps transition-colors" title="Void Session" type="button">
<span className="material-symbols-outlined text-[18px]">delete_sweep</span>
</button>
</div>
</div>
</div>
</div>
    </div>
  );
}
