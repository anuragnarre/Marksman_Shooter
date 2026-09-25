"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Award, Trophy, TrendingUp, TrendingDown, Minus, Filter, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Mock data for the leaderboard
const MOCK_LEADERBOARD = [
  { rank: 1, prevRank: 1, name: "David C.", rating: 2450, bestScore: 631.2, sessions: 142, isMe: false },
  { rank: 2, prevRank: 4, name: "Sarah L.", rating: 2380, bestScore: 629.8, sessions: 98, isMe: false },
  { rank: 3, prevRank: 2, name: "Michael T.", rating: 2345, bestScore: 627.5, sessions: 215, isMe: false },
  { rank: 4, prevRank: 6, name: "Shooter 1 (You)", rating: 2290, bestScore: 628.4, sessions: 84, isMe: true },
  { rank: 5, prevRank: 3, name: "James W.", rating: 2285, bestScore: 625.1, sessions: 112, isMe: false },
  { rank: 6, prevRank: 5, name: "Elena R.", rating: 2260, bestScore: 624.9, sessions: 67, isMe: false },
  { rank: 7, prevRank: 7, name: "Robert K.", rating: 2210, bestScore: 622.0, sessions: 156, isMe: false },
  { rank: 8, prevRank: 10, name: "Amanda J.", rating: 2195, bestScore: 621.8, sessions: 45, isMe: false },
];

export default function ShooterLeaderboard() {
  const [discipline, setDiscipline] = useState("10m Air Rifle");
  
  return (
    <DashboardLayout role="SHOOTER">
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Range Leaderboard</h1>
            <div className="flex items-center gap-2 text-on-surface-variant text-lg mt-1">
              <MapPin size={18} />
              <span>Main Indoor Range - 25yd</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select 
                className="appearance-none bg-surface-container-low border border-outline-variant/50 text-on-surface font-semibold rounded-xl h-10 pl-4 pr-10 focus:border-primary focus:outline-none cursor-pointer"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              >
                <option value="10m Air Rifle">10m Air Rifle</option>
                <option value="10m Air Pistol">10m Air Pistol</option>
                <option value="25m Rapid Fire Pistol">25m Rapid Fire Pistol</option>
                <option value="50m Rifle 3 Positions">50m Rifle 3 Positions</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
            <Button variant="outline" className="gap-2 border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl">
              <Filter size={18} /> Filters
            </Button>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end h-64 gap-4 md:gap-8 mt-12 mb-16">
          {/* Rank 2 */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest border-4 border-[#C0C0C0] flex items-center justify-center mb-4 relative z-10 shadow-[0_0_15px_rgba(192,192,192,0.3)]">
              <span className="text-xl font-bold text-on-surface-variant">SL</span>
              <div className="absolute -bottom-2 -right-2 bg-surface rounded-full p-1 border border-outline-variant/30">
                <TrendingUp size={12} className="text-primary" />
              </div>
            </div>
            <div className="w-24 md:w-32 bg-gradient-to-t from-surface-container-lowest to-[#C0C0C0]/20 border border-outline-variant/30 border-b-0 rounded-t-xl flex flex-col items-center justify-start pt-4 h-32">
              <span className="text-2xl font-bold text-[#C0C0C0]">2</span>
              <span className="text-xs font-bold text-on-surface text-center mt-2 px-2 truncate w-full">{MOCK_LEADERBOARD[1].name}</span>
              <span className="text-[10px] font-bold text-tertiary mt-1">{MOCK_LEADERBOARD[1].rating} ELO</span>
            </div>
          </div>

          {/* Rank 1 */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-700 z-10">
            <div className="w-20 h-20 rounded-full bg-surface-container-highest border-4 border-[#FFD700] flex items-center justify-center mb-4 relative z-10 shadow-[0_0_25px_rgba(255,215,0,0.4)]">
              <span className="text-2xl font-bold text-on-surface-variant">DC</span>
              <Trophy size={20} className="absolute -top-6 text-[#FFD700]" />
              <div className="absolute -bottom-2 -right-2 bg-surface rounded-full p-1 border border-outline-variant/30">
                <Minus size={12} className="text-on-surface-variant" />
              </div>
            </div>
            <div className="w-28 md:w-36 bg-gradient-to-t from-surface-container-lowest to-[#FFD700]/20 border border-outline-variant/30 border-b-0 rounded-t-xl flex flex-col items-center justify-start pt-4 h-40 shadow-[0_-10px_30px_rgba(255,215,0,0.1)]">
              <span className="text-4xl font-bold text-[#FFD700]">1</span>
              <span className="text-sm font-bold text-on-surface text-center mt-2 px-2 truncate w-full">{MOCK_LEADERBOARD[0].name}</span>
              <span className="text-xs font-bold text-tertiary mt-1">{MOCK_LEADERBOARD[0].rating} ELO</span>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest border-4 border-[#CD7F32] flex items-center justify-center mb-4 relative z-10 shadow-[0_0_15px_rgba(205,127,50,0.3)]">
              <span className="text-xl font-bold text-on-surface-variant">MT</span>
              <div className="absolute -bottom-2 -right-2 bg-surface rounded-full p-1 border border-outline-variant/30">
                <TrendingDown size={12} className="text-[#FF5252]" />
              </div>
            </div>
            <div className="w-24 md:w-32 bg-gradient-to-t from-surface-container-lowest to-[#CD7F32]/20 border border-outline-variant/30 border-b-0 rounded-t-xl flex flex-col items-center justify-start pt-4 h-24">
              <span className="text-2xl font-bold text-[#CD7F32]">3</span>
              <span className="text-xs font-bold text-on-surface text-center mt-2 px-2 truncate w-full">{MOCK_LEADERBOARD[2].name}</span>
              <span className="text-[10px] font-bold text-tertiary mt-1">{MOCK_LEADERBOARD[2].rating} ELO</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant/50">
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold w-20 text-center">Rank</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold">Athlete</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-right">Rating (ELO)</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-right hidden sm:table-cell">Best Score</th>
                  <th className="p-4 text-xs font-label-caps uppercase text-on-surface-variant font-bold text-right hidden md:table-cell">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADERBOARD.map((shooter) => (
                  <tr 
                    key={shooter.rank} 
                    className={`border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-high transition-colors ${
                      shooter.isMe ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-display font-bold text-lg text-on-surface">{shooter.rank}</span>
                        {shooter.rank < shooter.prevRank ? (
                          <TrendingUp size={14} className="text-primary" />
                        ) : shooter.rank > shooter.prevRank ? (
                          <TrendingDown size={14} className="text-[#FF5252]" />
                        ) : (
                          <Minus size={14} className="text-on-surface-variant" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                          <span className="text-xs font-bold text-on-surface-variant">{shooter.name[0]}</span>
                        </div>
                        <span className={`font-bold ${shooter.isMe ? 'text-primary' : 'text-on-surface'}`}>
                          {shooter.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-tertiary">{shooter.rating}</span>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell">
                      <span className="font-bold text-on-surface">{shooter.bestScore}</span>
                    </td>
                    <td className="p-4 text-right hidden md:table-cell text-on-surface-variant">
                      {shooter.sessions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-outline-variant/30 flex justify-center">
            <Button variant="ghost" className="text-primary hover:bg-primary/10">
              Load More
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
