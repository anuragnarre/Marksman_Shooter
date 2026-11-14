"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Users, QrCode, CreditCard, Ticket, Clock, CheckCircle, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/toast-context";
import { useRouter } from "next/navigation";

interface RecentCheckin {
  name: string;
  time: string;
  type: string;
  lane: string;
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}

const PASS_CATALOG = [
  { id: "day-std", title: "Standard Day Pass", price: 25.0 },
  { id: "day-prem", title: "Premium Day Pass (w/ Rental)", price: 45.0 },
  { id: "target-pack", title: "Target Pack (50)", price: 12.0 },
];

// STAFF Dashboard
export default function StaffDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([
    { name: "Michael T.", time: "10 mins ago", type: "Member", lane: "Lane 4" },
    { name: "Sarah L.", time: "25 mins ago", type: "Member", lane: "Lane 1" },
    { name: "John D.", time: "42 mins ago", type: "Guest Pass", lane: "Lane 8" },
  ]);
  const [lastScannedPass, setLastScannedPass] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posOpen, setPosOpen] = useState(false);

  const handleCheckIn = () => {
    const query = memberId.trim();
    if (!query) {
      toast("Enter a Member ID, Name, or Phone Number first", "warning");
      return;
    }
    const nextLane = `Lane ${((recentCheckins.length + 1) % 12) + 1}`;
    const entry: RecentCheckin = {
      name: query.startsWith("MKSM") ? `Athlete (${query})` : query,
      time: "Just now",
      type: "Front Desk Check-In",
      lane: nextLane,
    };
    setRecentCheckins((prev) => [entry, ...prev]);
    setLastScannedPass(`${entry.name} cleared for ${nextLane}`);
    setMemberId("");
    toast(`${entry.name} checked in to ${nextLane}`, "success");
  };

  const handleQuickQrScan = () => {
    const simulatedCode = `MKSM-${Math.floor(1000 + Math.random() * 9000)}`;
    setMemberId(simulatedCode);
    setLastScannedPass(`QR Token ${simulatedCode} read by Desk Scanner — tap Check In or open Express Kiosk`);
    toast(`Scanned QR Token ${simulatedCode}`, "info");
  };

  const handleAddPass = (item: { id: string; title: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast(`Added ${item.title} ($${item.price.toFixed(2)}) to POS cart`, "success");
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleProcessPos = () => {
    if (cart.length === 0) {
      toast("Select a pass or item before processing payment", "warning");
      return;
    }
    toast(`POS payment processed: $${(subtotal * 1.08).toFixed(2)} (${totalCount} items)`, "success");
    setCart([]);
    setPosOpen(false);
  };

  return (
    <DashboardLayout role="STAFF" showBack pageTitle="Staff Front Desk">
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-on-surface tracking-tight">Front Desk / Staff</h1>
            <p className="text-on-surface-variant mt-1 sm:mt-2 text-sm sm:text-lg">Manage check-ins, guest passes, and range access.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant uppercase font-bold">Shift Status</p>
              <div className="font-bold text-[#4CAF50] flex items-center gap-1.5 justify-end">
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse" /> Clocked In
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Check-In Panel */}
          <div className="lg:col-span-2 bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-5">
              <Users className="text-primary" size={22} /> Athlete Check-In
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1 mb-1 block">Member ID or Phone</label>
                <Input
                  placeholder="Enter ID, Name, or Phone Number..."
                  className="text-base py-3 sm:py-5 rounded-2xl bg-surface-container-high border-outline-variant/50"
                  value={memberId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberId(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleCheckIn()}
                />
              </div>
              <div className="sm:pt-5 flex gap-2">
                <Button
                  type="button"
                  onClick={handleCheckIn}
                  className="flex-1 sm:flex-none h-11 sm:h-12 bg-primary text-on-primary hover:bg-primary/90 font-bold px-6 rounded-2xl shadow-md"
                >
                  Check In
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQuickQrScan}
                  title="Simulate QR Desk Scanner"
                  className="h-11 sm:h-12 border-outline-variant/50 rounded-2xl px-4 hover:bg-surface-container-high"
                >
                  <QrCode size={20} />
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 flex flex-col items-center justify-center gap-3 text-center">
              <QrCode size={42} className={lastScannedPass ? "text-[#4CAF50]" : "text-on-surface-variant opacity-60"} />
              <p className="font-bold text-base sm:text-lg text-on-surface">
                {lastScannedPass || "Ready to Scan"}
              </p>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Tap the QR scanner icon above to read a gate token or launch the full turnstile kiosk.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/checkin")}
                className="rounded-xl border-outline-variant/40 text-xs font-bold"
              >
                Open Express Gate Kiosk
              </Button>
            </div>
          </div>

          {/* Quick Sales / Passes */}
          <div className="bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-5">
              <Ticket className="text-tertiary" size={22} /> Guest Passes
            </h2>

            <div className="space-y-3 flex-1">
              {PASS_CATALOG.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    onClick={() => handleAddPass(item)}
                    className="w-full justify-between py-4 px-4 rounded-2xl border-outline-variant/50 hover:border-tertiary/50 hover:bg-tertiary/5 flex items-center gap-2 h-auto text-left"
                  >
                    <div>
                      <span className="font-bold text-sm sm:text-base text-on-surface block">{item.title}</span>
                      <span className="text-tertiary font-bold text-sm">${item.price.toFixed(2)}</span>
                    </div>
                    {inCart && (
                      <span className="px-2.5 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-xs font-mono font-bold">
                        x{inCart.qty}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-outline-variant/20">
              <Button
                type="button"
                onClick={() => setPosOpen(true)}
                className="w-full py-4 sm:py-5 rounded-2xl bg-surface-container-highest text-on-surface font-bold hover:bg-outline-variant/30 flex justify-center gap-2"
              >
                <CreditCard size={20} /> Open POS System ({totalCount} items • ${subtotal.toFixed(2)})
              </Button>
            </div>
          </div>
        </div>

        {/* Recently Checked In */}
        <div className="bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5">
            <Clock className="text-primary" size={20} /> Recently Checked In
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCheckins.map((u, i) => (
              <div key={`${u.name}-${i}`} className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20">
                <div className="w-11 h-11 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="text-primary" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface truncate">{u.name}</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                    <span>{u.time}</span>
                    <span className="w-1 h-1 bg-outline-variant rounded-full" />
                    <span className="font-bold text-primary">{u.lane}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POS Register Modal */}
      {posOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPosOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant/40 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-lg font-display font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Desk POS Checkout
              </h3>
              <button type="button" onClick={() => setPosOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <X size={18} />
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-6 text-center font-mono">
                Cart is empty. Tap any Guest Pass to ring it up.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{item.title}</p>
                      <p className="text-xs font-mono text-tertiary">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-mono text-xs font-bold w-5 text-center">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-outline-variant/20 pt-3 space-y-1 text-xs font-mono text-on-surface-variant">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Facility Tax (8%)</span>
                <span>${(subtotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-on-surface pt-1">
                <span>Total Due</span>
                <span>${(subtotal * 1.08).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setPosOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleProcessPos} className="bg-primary text-on-primary font-bold">
                Process Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
