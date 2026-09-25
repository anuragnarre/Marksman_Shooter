"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Trophy, ChevronLeft, Search, Filter, MonitorPlay, Maximize } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

// Simulating live updating scoreboard
const INITIAL_SCOREBOARD = [
  { rank: 1, name: "David C.", club: "Elite Marksmen", score: 628.4, series: [104.5, 105.1, 104.8, 104.2, 105.0, 104.8], lastShot: 10.8 },
  { rank: 2, name: "Sarah L.", club: "State Academy", score: 627.1, series: [103.8, 104.2, 105.5, 104.9, 104.1, 104.6], lastShot: 10.5 },
  { rank: 3, name: "Michael T.", club: "Precision Club", score: 625.5, series: [104.0, 103.5, 104.8, 104.5, 103.9, 104.8], lastShot: 10.2 },
  { rank: 4, name: "Elena R.", club: "Elite Marksmen", score: 624.2, series: [103.1, 104.0, 103.8, 104.7, 104.4, 104.2], lastShot: 10.6 },
  { rank: 5, name: "Robert K.", club: "Independent", score: 621.8, series: [102.5, 103.9, 104.1, 103.5, 103.8, 104.0], lastShot: 9.8 },
];

export default function CompetitionsScoreboard() {
  const [scoreboard, setScoreboard] = useState(INITIAL_SCOREBOARD);
  const [liveMode, setLiveMode] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!liveMode) return;
    
    const interval = setInterval(() => {
      setScoreboard(current => {
        // Randomly update a player's last shot and score slightly to simulate live feed
        const newScoreboard = [...current];
        const randomPlayerIdx = Math.floor(Math.random() * newScoreboard.length);
        const randomShot = (Math.random() * 1.5 + 9.4).toFixed(1); // 9.4 to 10.9
        
        newScoreboard[randomPlayerIdx] = {
          ...newScoreboard[randomPlayerIdx],
          lastShot: parseFloat(randomShot),
          score: parseFloat((newScoreboard[randomPlayerIdx].score + 0.1).toFixed(1)) // Just a mock bump
        };
        
        // Re-sort
        return newScoreboard.sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [liveMode]);

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header & Breadcrumb */}
        <div className="flex items-center gap-2 text-on-surface-variant font-bold mb-2">
          <Link href="/competitions/dashboard" className="hover:text-primary flex items-center">
            <ChevronLeft size={16} /> Back to Competitions
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#FF5252]/10 text-[#FF5252] text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#FF5252] rounded-full"></span> LIVE
              </span>
              <span className="text-xs font-bold text-on-surface-variant border border-outline-variant/30 px-2 py-0.5 rounded">
                10m Air Rifle Men
              </span>
            </div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">State Winter Championship 2026</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant={liveMode ? "default" : "outline"}
              className={`gap-2 font-bold rounded-xl ${liveMode ? 'bg-[#FF5252] text-white hover:bg-[#FF5252]/90 shadow-[0_0_15px_rgba(255,82,82,0.3)]' : 'border-outline-variant/50'}`}
              onClick={() => setLiveMode(!liveMode)}
            >
              <MonitorPlay size={18} /> {liveMode ? 'Live Feed Active' : 'Resume Live Feed'}
            </Button>
            <Button variant="outline" className="gap-2 border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high rounded-xl">
              <Maximize size={18} /> TV Display Mode
            </Button>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden shadow-lg mt-8 relative">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50">
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold w-16 text-center">Rank</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold">Athlete</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center">Club/Team</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center">1</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center">2</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center hidden sm:table-cell">3</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center hidden sm:table-cell">4</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center hidden md:table-cell">5</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-center hidden md:table-cell">6</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-primary font-bold text-center bg-primary/5">Last Shot</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface font-bold text-right pr-8 bg-surface-container-highest/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, idx) => (
                  <tr 
                    key={entry.name} 
                    className={`border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-high/50 transition-all duration-500 ${
                      idx === 0 ? 'bg-gradient-to-r from-[#FFD700]/10 to-transparent' :
                      idx === 1 ? 'bg-gradient-to-r from-[#C0C0C0]/10 to-transparent' :
                      idx === 2 ? 'bg-gradient-to-r from-[#CD7F32]/10 to-transparent' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        {idx === 0 ? <Trophy size={20} className="text-[#FFD700]" /> :
                         idx === 1 ? <Trophy size={18} className="text-[#C0C0C0]" /> :
                         idx === 2 ? <Trophy size={16} className="text-[#CD7F32]" /> :
                         <span className="font-display font-bold text-lg text-on-surface-variant">{entry.rank}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-on-surface text-lg">{entry.name}</span>
                    </td>
                    <td className="p-4 text-center text-sm font-semibold text-on-surface-variant">
                      {entry.club}
                    </td>
                    
                    {entry.series.map((score, sIdx) => (
                      <td key={sIdx} className={`p-4 text-center font-semibold text-on-surface ${sIdx > 1 ? 'hidden sm:table-cell' : ''} ${sIdx > 3 ? 'hidden md:table-cell' : ''}`}>
                        {score.toFixed(1)}
                      </td>
                    ))}

                    <td className="p-4 text-center bg-primary/5">
                      <span className={`inline-block px-3 py-1 rounded font-bold ${
                        entry.lastShot >= 10.5 ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' :
                        entry.lastShot >= 10.0 ? 'bg-primary/20 text-primary' :
                        'bg-surface-container-highest text-on-surface'
                      }`}>
                        {entry.lastShot.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-8 bg-surface-container-highest/30">
                      <span className="font-display font-bold text-2xl text-on-surface">{entry.score.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
