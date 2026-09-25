"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Users, QrCode, CreditCard, Ticket, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// STAFF Dashboard
export default function StaffDashboard() {
  const [memberId, setMemberId] = useState("");

  return (
    <DashboardLayout role="STAFF">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-24 h-full overflow-y-auto">
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Front Desk / Staff</h1>
            <p className="text-on-surface-variant mt-2 text-lg">Manage check-ins, guest passes, and range access.</p>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
               <p className="text-xs text-on-surface-variant uppercase font-bold">Shift Status</p>
               <p className="font-bold text-[#4CAF50] flex items-center gap-1 justify-end">
                 <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div> Clocked In
               </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Check-In Panel */}
           <div className="lg:col-span-2 bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Users className="text-primary" size={24} /> Athlete Check-In
              </h2>
              
              <div className="flex gap-4 mb-8">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-on-surface-variant uppercase ml-1 mb-1 block">Member ID or Phone</label>
                   <Input 
                     placeholder="Enter ID or Phone Number..." 
                     className="text-lg py-6 rounded-2xl bg-surface-container-high border-outline-variant/50"
                     value={memberId}
                     onChange={(e) => setMemberId(e.target.value)}
                   />
                 </div>
                 <div className="pt-5 flex gap-2">
                   <Button className="h-full bg-primary text-on-primary hover:bg-primary/90 font-bold px-8 rounded-2xl shadow-md">
                     Check In
                   </Button>
                   <Button variant="outline" className="h-full border-outline-variant/50 rounded-2xl px-6 hover:bg-surface-container-high">
                     <QrCode size={20} />
                   </Button>
                 </div>
              </div>

              <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 flex items-center justify-center">
                 <div className="text-center text-on-surface-variant opacity-60">
                    <QrCode size={48} className="mx-auto mb-4" />
                    <p className="font-bold text-lg">Ready to Scan</p>
                    <p className="text-sm">Scan athlete membership card or enter ID above.</p>
                 </div>
              </div>
           </div>

           {/* Quick Sales / Passes */}
           <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Ticket className="text-tertiary" size={24} /> Guest Passes
              </h2>
              
              <div className="space-y-4 flex-1">
                 <Button variant="outline" className="w-full justify-start py-8 rounded-2xl border-outline-variant/50 hover:border-tertiary/50 hover:bg-tertiary/5 flex-col items-start gap-1 h-auto">
                    <span className="font-bold text-lg text-on-surface">Standard Day Pass</span>
                    <span className="text-tertiary font-bold">$25.00</span>
                 </Button>
                 
                 <Button variant="outline" className="w-full justify-start py-8 rounded-2xl border-outline-variant/50 hover:border-tertiary/50 hover:bg-tertiary/5 flex-col items-start gap-1 h-auto">
                    <span className="font-bold text-lg text-on-surface">Premium Day Pass (w/ Rental)</span>
                    <span className="text-tertiary font-bold">$45.00</span>
                 </Button>

                 <Button variant="outline" className="w-full justify-start py-8 rounded-2xl border-outline-variant/50 hover:border-tertiary/50 hover:bg-tertiary/5 flex-col items-start gap-1 h-auto">
                    <span className="font-bold text-lg text-on-surface">Target Pack (50)</span>
                    <span className="text-tertiary font-bold">$12.00</span>
                 </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant/20">
                 <Button className="w-full py-6 rounded-2xl bg-surface-container-highest text-on-surface font-bold hover:bg-outline-variant/30 flex justify-center gap-2">
                   <CreditCard size={20} /> Open POS System
                 </Button>
              </div>
           </div>
        </div>

        {/* Recently Checked In */}
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
           <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
             <Clock className="text-primary" size={20} /> Recently Checked In
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Michael T.", time: "10 mins ago", type: "Member", lane: "Lane 4" },
                { name: "Sarah L.", time: "25 mins ago", type: "Member", lane: "Lane 1" },
                { name: "John D.", time: "42 mins ago", type: "Guest Pass", lane: "Lane 8" },
              ].map((user, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                       <CheckCircle className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{user.name}</p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span>{user.time}</span>
                        <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                        <span className="font-bold text-primary">{user.lane}</span>
                      </p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
