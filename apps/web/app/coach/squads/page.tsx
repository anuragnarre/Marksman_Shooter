"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Users, Search, Plus, Filter, MoreVertical, Edit, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MOCK_SQUADS = [
  { 
    id: 1, 
    name: "Alpha Squad (10m AR)", 
    members: [
      { id: 101, name: "David C.", rating: 2450, trend: "up" },
      { id: 102, name: "Sarah L.", rating: 2380, trend: "down" },
      { id: 103, name: "Michael T.", rating: 2345, trend: "stable" }
    ],
    schedule: "Mon/Wed/Fri - 14:00"
  },
  { 
    id: 2, 
    name: "Junior Development", 
    members: [
      { id: 201, name: "Elena R.", rating: 1980, trend: "up" },
      { id: 202, name: "Robert K.", rating: 1950, trend: "up" }
    ],
    schedule: "Tue/Thu - 16:00"
  }
];

export default function CoachSquads() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout role="COACH">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">My Squads</h1>
            <p className="text-on-surface-variant text-lg mt-1">Manage your training groups and athletes.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Plus size={18} /> Create New Squad
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <Input 
              placeholder="Search squads or athletes..." 
              className="pl-10 h-12 bg-surface-container-low border-outline-variant/50 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high">
              <Filter size={18} className="mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* Squad Lists */}
        <div className="space-y-8">
          {MOCK_SQUADS.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((squad) => (
            <div key={squad.id} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl overflow-hidden shadow-sm">
              {/* Squad Header */}
              <div className="bg-surface-container-high px-6 py-4 flex justify-between items-center border-b border-outline-variant/50">
                <div>
                  <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <Users size={20} className="text-primary" /> {squad.name}
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">Schedule: {squad.schedule} • {squad.members.length} Athletes</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-outline-variant/50 bg-surface-container-lowest h-9 px-3">
                    <Edit size={14} className="mr-2" /> Edit Squad
                  </Button>
                  <Button variant="outline" className="border-outline-variant/50 bg-surface-container-lowest h-9 px-3 text-primary border-primary/30">
                    <Plus size={14} className="mr-2" /> Add Athlete
                  </Button>
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-xs font-label-caps uppercase text-on-surface-variant font-bold">
                      <th className="p-4 pl-6">Athlete Name</th>
                      <th className="p-4 text-center">Rating (ELO)</th>
                      <th className="p-4 text-center">Recent Trend</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {squad.members.map((member) => (
                      <tr key={member.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs">
                              {member.name.substring(0,2).toUpperCase()}
                            </div>
                            <span className="font-bold text-on-surface">{member.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-tertiary">
                          {member.rating}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                            member.trend === 'up' ? 'bg-primary/10 text-primary' :
                            member.trend === 'down' ? 'bg-[#FF5252]/10 text-[#FF5252]' : 'bg-surface-container-highest text-on-surface-variant'
                          }`}>
                            {member.trend}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button variant="ghost" className="h-8 w-8 p-0 text-on-surface-variant hover:text-on-surface">
                            <MoreVertical size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {MOCK_SQUADS.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="text-center py-12">
              <p className="text-on-surface-variant text-lg">No squads found matching your search.</p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
