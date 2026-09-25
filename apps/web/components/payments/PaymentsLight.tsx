import React from 'react';

export function PaymentsLight({ billingHistory = [], subscriptionPlans = [], currentPlan = null, totalRevenue = 0, pendingAmount = 0, overdueAmount = 0, isLoading = false, error = null, refetch = () => {} }: any) {
  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full pb-12">
{/* Top Operational Banner & Currency Controls */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="font-label-sm text-label-sm uppercase tracking-widest px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">TERMINAL POS-01 // AUDIT SYNCHRONIZED</span>
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse" />
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">Payments, POS &amp; Session Invoicing</h1>
<p className="font-body-md text-body-md text-on-surface-variant">Live station register, match fees, equipment hire, and automated armory billing.</p>
</div>
<div className="flex items-center gap-3">
{/* Currency Switcher Segmented Control */}
<div className="flex items-center bg-surface-container-low p-1 rounded">
<button className="px-3 py-1 font-label-md text-label-md font-semibold bg-surface-container-lowest text-on-surface shadow-sm rounded">USD ($)</button>
<button className="px-3 py-1 font-label-md text-label-md font-medium text-on-surface-variant hover:text-on-surface transition-colors">EUR (€)</button>
<button className="px-3 py-1 font-label-md text-label-md font-medium text-on-surface-variant hover:text-on-surface transition-colors">GBP (£)</button>
</div>
{/* Action Button */}
<button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold uppercase rounded shadow-sm hover:opacity-90 active:scale-95 transition-all">
<span className="material-symbols-outlined text-[18px]">add</span>
<span className="">Open New Bill / Walk-in</span>
</button>
</div>
</div>
{/* Operational Telemetry Metric Tiles */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
{/* Tile 1 */}
<div className="bg-surface-container-lowest p-4 rounded shadow-sm flex flex-col justify-between relative overflow-hidden group">
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Daily Gross Revenue</span>
<span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold tracking-tight">$1,845.50</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-1.5 py-0.5 rounded flex items-center gap-0.5">
<span className="material-symbols-outlined text-[12px]">trending_up</span>+14%
        </span>
</div>
<div className="mt-2 text-on-surface-variant font-body-sm text-body-sm flex justify-between items-center">
<span className="">Target: $2,200.00</span>
<span className="font-label-sm text-label-sm font-semibold">83.8% met</span>
</div>
<div className="w-full bg-surface-container h-1 rounded mt-1.5 overflow-hidden">
<div className="bg-secondary h-full rounded w-[83.8%]" />
</div>
</div>
{/* Tile 2 */}
<div className="bg-surface-container-lowest p-4 rounded shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Active Unbilled Sessions</span>
<span className="material-symbols-outlined text-secondary text-[20px]">timelapse</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-telemetry-xl text-telemetry-xl text-secondary font-bold tracking-tight">03</span>
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Lanes on bench</span>
</div>
<div className="mt-2 text-on-surface-variant font-body-sm text-body-sm flex justify-between items-center">
<span className="">Awaiting Lane Checkout</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Action Needed</span>
</div>
<div className="w-full bg-surface-container h-1 rounded mt-1.5 overflow-hidden">
<div className="bg-secondary-container h-full rounded w-[45%]" />
</div>
</div>
{/* Tile 3 */}
<div className="bg-surface-container-lowest p-4 rounded shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">PCP Air Refill Station</span>
<span className="material-symbols-outlined text-on-surface text-[20px]">compress</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold tracking-tight">$240.00</span>
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-semibold">30 Fills</span>
</div>
<div className="mt-2 text-on-surface-variant font-body-sm text-body-sm flex justify-between items-center">
<span className="">Compressor bank 300 BAR</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">Nominal</span>
</div>
<div className="w-full bg-surface-container h-1 rounded mt-1.5 overflow-hidden">
<div className="bg-on-tertiary-container h-full rounded w-[72%]" />
</div>
</div>
{/* Tile 4 */}
<div className="bg-surface-container-lowest p-4 rounded shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Retail &amp; Ammo Depot</span>
<span className="material-symbols-outlined text-on-surface text-[20px]">inventory_2</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold tracking-tight">$465.00</span>
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-semibold">31 Tins</span>
</div>
<div className="mt-2 text-on-surface-variant font-body-sm text-body-sm flex justify-between items-center">
<span className="">JSB / H&amp;N / QYS Pellets</span>
<span className="font-label-sm text-label-sm font-semibold text-on-surface">Daily High</span>
</div>
<div className="w-full bg-surface-container h-1 rounded mt-1.5 overflow-hidden">
<div className="bg-primary h-full rounded w-[60%]" />
</div>
</div>
</div>
{/* Main Split Layout (60% Ledger Table / 40% Active POS Terminal) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/* Left Column: Transactions Ledger & Active Queue (7 cols = ~58-60%) */}
<div className="lg:col-span-7 flex flex-col gap-4">
<div className="bg-surface-container-lowest rounded shadow-sm overflow-hidden">
{/* Panel Header */}
<div className="p-4 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface text-[22px]">receipt_long</span>
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Live Range Checkout &amp; Transaction Queue</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Real-time lane charges, member credit reconciliations, and match fees.</p>
</div>
</div>
<div className="flex items-center gap-2">
<div className="flex items-center bg-surface-container-lowest rounded px-2.5 py-1 shadow-sm">
<span className="material-symbols-outlined text-on-surface-variant text-[16px] mr-1.5">search</span>
<input className="bg-transparent font-body-sm text-body-sm text-on-surface outline-none w-36 sm:w-48 placeholder:text-on-surface-variant/60" placeholder="Search bill, shooter, lane..." type="text" />
</div>
<button className="p-1.5 rounded bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm">
<span className="material-symbols-outlined text-[18px]">filter_list</span>
</button>
</div>
</div>
{/* Table View */}
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="bg-surface-container-low/60 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
<th className="py-3 px-4">Invoice #</th>
<th className="py-3 px-4">Shooter / Member</th>
<th className="py-3 px-4">Lane &amp; Duration</th>
<th className="py-3 px-4">Equipment / Add-ons</th>
<th className="py-3 px-4 text-right">Total Due</th>
<th className="py-3 px-4 text-center">Status</th>
<th className="py-3 px-4 text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y-0">
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
{/* Quick Summary Footer in Left Panel */}
<div className="p-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2 text-on-surface-variant font-label-sm text-label-sm">
<div className="flex items-center gap-2">
<span className="font-semibold text-on-surface">Showing 4 of 28 sessions today</span>
<span className="">•</span>
<span className="">Filtered: Active Shift</span>
</div>
<div className="flex items-center gap-4">
<span className="">Subtotal Cleared: <strong className="text-on-surface">$267.00</strong></span>
<span className="">Unpaid Float: <strong className="text-secondary">$42.50</strong></span>
</div>
</div>
</div>
{/* Quick Armory & PCP Station Quick-Add Bar */}
<div className="bg-surface-container-lowest p-4 rounded shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-surface">bolt</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Fast POS Add-On Keys</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Tap to append to selected bill</span>
</div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
<button className="flex flex-col items-start p-2.5 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">PCP Air Fill</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">$8.00</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">300 Bar Dive Tank</span>
</button>
<button className="flex flex-col items-start p-2.5 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">JSB Exact .22</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">$16.50</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">500 Count Pellets</span>
</button>
<button className="flex flex-col items-start p-2.5 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Ear Pro Loaner</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">$4.00</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Electronic Headset</span>
</button>
<button className="flex flex-col items-start p-2.5 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Chrono Test</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">$10.00</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">10-Shot FPS Printout</span>
</button>
</div>
</div>
</div>
{/* Right Column: Active POS Terminal Card (5 cols = ~40-42%) */}
<div className="lg:col-span-5 flex flex-col gap-4">
<div className="bg-surface-container-lowest rounded shadow-md overflow-hidden">
{/* POS Terminal Screen Header */}
<div className="bg-primary text-on-primary p-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-[24px]">point_of_sale</span>
<div>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-on-primary/70">Point-of-Sale Checkout</span>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">Sarah Jenkins - Lane 04</h3>
</div>
</div>
<span className="font-label-md text-label-md font-bold px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded shadow-sm">
            INV-8843
          </span>
</div>
<div className="p-5 flex flex-col gap-5">
{/* Shooter Session Context Badge */}
<div className="bg-surface-container-low p-3 rounded flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center font-bold text-on-surface font-label-md text-label-md">
                SJ
              </div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Sarah Jenkins</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Walk-in Shooter • ID Verified • First Visit</span>
</div>
</div>
<div className="text-right">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Lane 04 (60m)</span>
<div className="font-label-md text-label-md font-bold text-on-surface">14:00 - 15:00</div>
</div>
</div>
{/* Itemized Cart Breakdown */}
<div className="flex flex-col gap-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Itemized Session Fees</span>
<div className="flex flex-col divide-y-0 gap-1.5">
{/* Item 1 */}
<div className="flex items-center justify-between p-2.5 rounded bg-surface-container-low/60 hover:bg-surface-container-low transition-colors">
<div className="flex flex-col">
<span className="font-body-md text-body-md text-on-surface font-semibold">60 Min Range Lane Fee</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Precision Air Lane #04 (Target Retrieval Enabled)</span>
</div>
<div className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">$25.00</div>
</div>
{/* Item 2 */}
<div className="flex items-center justify-between p-2.5 rounded bg-surface-container-low/60 hover:bg-surface-container-low transition-colors">
<div className="flex flex-col">
<span className="font-body-md text-body-md text-on-surface font-semibold">Club Airgun Rental</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Feinwerkbau 800 Target Rifle (.177 Match)</span>
</div>
<div className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">$12.00</div>
</div>
{/* Item 3 */}
<div className="flex items-center justify-between p-2.5 rounded bg-surface-container-low/60 hover:bg-surface-container-low transition-colors">
<div className="flex flex-col">
<span className="font-body-md text-body-md text-on-surface font-semibold">Target Paper Roll (200 shots)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">17x17cm Official ISSF Airgun Scoring Spec</span>
</div>
<div className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">$5.50</div>
</div>
</div>
</div>
{/* Subtotal / Tax Calculation Ledger Well */}
<div className="bg-surface-container-low p-3.5 rounded flex flex-col gap-2">
<div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
<span className="">Subtotal Due</span>
<span className="font-label-md text-label-md text-on-surface font-bold">$42.50</span>
</div>
<div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
<span className="">Municipal Range Tax (8%)</span>
<span className="font-label-md text-label-md text-on-surface font-bold">$3.40</span>
</div>
<div className="flex justify-between items-baseline pt-2">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface uppercase tracking-tight">Total Balance</span>
<span className="font-telemetry-xl text-telemetry-xl font-bold text-secondary tracking-tight">$45.90</span>
</div>
</div>
{/* Tip / RSO Gratuity Segmented Selector */}
<div className="flex flex-col gap-1.5">
<div className="flex justify-between items-center">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">RSO Safety Officer Gratuity</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Optional</span>
</div>
<div className="grid grid-cols-4 gap-2">
<button className="py-2 rounded font-label-md text-label-md font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors">None</button>
<button className="py-2 rounded font-label-md text-label-md font-semibold bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors">10% ($4.59)</button>
<button className="py-2 rounded font-label-md text-label-md font-semibold bg-primary text-on-primary shadow-sm">15% ($6.88)</button>
<button className="py-2 rounded font-label-md text-label-md font-semibold bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors">Custom</button>
</div>
</div>
{/* Payment Method Selector */}
<div className="flex flex-col gap-2">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Select Tender Method</span>
<div className="grid grid-cols-2 gap-2">
{/* CC Option (Selected) */}
<button className="p-3 rounded bg-surface-container-low hover:bg-surface-container text-left flex items-center gap-3 transition-colors bg-surface-container-high/60 shadow-sm">
<span className="material-symbols-outlined text-[20px] text-secondary">credit_card</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Credit / Debit</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">EMV Chip / Swipe</span>
</div>
</button>
{/* Cash Option */}
<button className="p-3 rounded bg-surface-container-low hover:bg-surface-container text-left flex items-center gap-3 transition-colors">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant">payments</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Cash Drawer</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Auto-till trigger</span>
</div>
</button>
{/* Member Balance */}
<button className="p-3 rounded bg-surface-container-low hover:bg-surface-container text-left flex items-center gap-3 transition-colors">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant">account_balance_wallet</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Member Balance</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">$0.00 (Walk-in)</span>
</div>
</button>
{/* NFC Digital Tap */}
<button className="p-3 rounded bg-surface-container-low hover:bg-surface-container text-left flex items-center gap-3 transition-colors">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant">contactless</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Digital Tap</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Apple / Google Pay</span>
</div>
</button>
</div>
</div>
{/* Checkout Execution Trigger Button */}
<div className="flex flex-col gap-2 pt-2">
<button className="w-full py-3.5 px-4 bg-primary text-on-primary rounded font-label-lg text-label-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all">
<span className="material-symbols-outlined text-[20px]">check_circle</span>
<span className="">Process Payment ($45.90)</span>
</button>
{/* Secondary Actions: Print Receipt & Email Scorecard */}
<div className="grid grid-cols-2 gap-2">
<button className="py-2.5 px-3 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors">
<span className="material-symbols-outlined text-[18px]">print</span>
<span className="">Thermal Receipt</span>
</button>
<button className="py-2.5 px-3 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors">
<span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
<span className="">Email Scorecard</span>
</button>
</div>
</div>
</div>
{/* Terminal Status Strip */}
<div className="bg-surface-container-low px-4 py-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
<span className="">CARD READER: READY (PAX A920)</span>
</div>
<span className="">ENCRYPTION: AES-256 E2EE</span>
</div>
</div>
</div>
</div>
</div>
    </div>
  );
}
