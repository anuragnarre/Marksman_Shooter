'use client';

const gateways = [
  { name: 'Cashfree', color: '#5C6BC0' },
  { name: 'Razorpay', color: '#2196F3' },
  { name: 'Paytm', color: '#00B9F1' },
];

export default function PaymentComingSoon() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
      <h3 className="mb-1 text-lg font-semibold text-white">Payment</h3>
      <p className="mb-5 text-sm text-[#8892A4]">
        Online payment will be available soon. Registration is free for now.
      </p>

      <div className="flex flex-wrap gap-3">
        {gateways.map((g) => (
          <div
            key={g.name}
            className="relative flex items-center gap-2 rounded-xl border border-white/5 bg-[#161B26] px-4 py-3"
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: g.color }}
            />
            <span className="text-sm font-medium text-[#8892A4]">{g.name}</span>
            <span className="absolute -right-1 -top-1 rounded-full bg-[#F5A623]/20 px-2 py-0.5 text-[10px] font-semibold text-[#F5A623]">
              Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
