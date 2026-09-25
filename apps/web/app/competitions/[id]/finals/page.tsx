"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Target, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";


// Simulating live finals data
const INITIAL_FINALS = [
  { rank: 1, name: "David C.", club: "Elite Marksmen", score: 251.4, series: [52.5, 52.1, 20.8, 20.2, 21.0, 20.8, 21.2, 21.5, 21.3], status: "ACTIVE" },
  { rank: 2, name: "Sarah L.", club: "State Academy", score: 249.7, series: [51.8, 51.2, 20.5, 21.0, 20.8, 21.1, 20.9, 21.2, 21.2], status: "ACTIVE" },
  { rank: 3, name: "Michael T.", club: "Precision Club", score: 228.5, series: [51.0, 50.5, 20.8, 20.5, 21.9, 21.8, 21.1, 20.9], status: "ELIMINATED" },
  { rank: 4, name: "Elena R.", club: "Elite Marksmen", score: 207.2, series: [50.1, 51.0, 20.8, 20.7, 21.4, 21.2, 22.0], status: "ELIMINATED" },
  { rank: 5, name: "Robert K.", club: "Independent", score: 186.1, series: [49.5, 50.9, 21.1, 21.5, 20.8, 22.3], status: "ELIMINATED" },
  { rank: 6, name: "Jessica W.", club: "National Team", score: 164.8, series: [49.5, 50.9, 20.1, 21.5, 22.8], status: "ELIMINATED" },
  { rank: 7, name: "Thomas B.", club: "State Academy", score: 143.2, series: [48.5, 49.2, 21.1, 24.4], status: "ELIMINATED" },
  { rank: 8, name: "William H.", club: "Elite Marksmen", score: 121.9, series: [48.5, 48.1, 25.3], status: "ELIMINATED" },
];

export default function CompetitionFinalsMode() {
  const params = useParams();
  const [scoreboard, setScoreboard] = useState(INITIAL_FINALS);

  return (
    <div className="bg-surface-container-lowest min-h-screen text-on-surface font-sans overflow-hidden">
      <div className="flex flex-col h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-5xl font-display font-bold text-on-surface tracking-tight uppercase flex items-center gap-4">
              <Target className="text-[#FF5252]" size={48} />
              Finals Mode
            </h1>
            <h2 className="text-2xl text-primary font-bold mt-2">10m Air Rifle Men - Gold Medal Match</h2>
          </div>
          <div className="flex items-center gap-3">
             <span className="bg-[#FF5252]/20 text-[#FF5252] text-xl font-bold uppercase px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse border border-[#FF5252]/50 shadow-[0_0_15px_rgba(255,82,82,0.3)]">
                <span className="w-3 h-3 bg-[#FF5252] rounded-full"></span> LIVE ELIMINATION
              </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Shooters View */}
          <div className="bg-surface-container border-2 border-primary/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative col-span-2">
            <div className="bg-primary/10 py-4 px-6 border-b border-primary/30 flex justify-between items-center">
               <h3 className="text-2xl font-bold text-primary uppercase tracking-wider">Remaining Athletes</h3>
               <span className="text-on-surface-variant font-bold text-lg">Shot 24 of 24</span>
            </div>
            
            <div className="flex-1 flex flex-col">
              {scoreboard.filter(s => s.status === 'ACTIVE').map((athlete, idx) => (
                <div key={athlete.name} className={`flex-1 flex items-center px-8 border-b border-outline-variant/20 last:border-0 ${idx === 0 ? 'bg-gradient-to-r from-[#FFD700]/10 to-transparent' : 'bg-gradient-to-r from-[#C0C0C0]/10 to-transparent'}`}>
                   <div className="flex items-center justify-center w-24">
                     {idx === 0 ? <Trophy size={48} className="text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" /> :
                      idx === 1 ? <Trophy size={40} className="text-[#C0C0C0] drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]" /> : null}
                   </div>
                   <div className="w-1/3 flex flex-col ml-4">
                     <span className="font-bold text-on-surface text-5xl tracking-tight">{athlete.name}</span>
                     <span className="text-on-surface-variant text-2xl uppercase tracking-wide font-semibold mt-1">{athlete.club}</span>
                   </div>
                   
                   <div className="flex-1 flex justify-end items-center gap-4">
                     <div className="flex gap-2">
                       {athlete.series.map((score, sIdx) => (
                         <div key={sIdx} className="flex flex-col items-center">
                           <span className="text-xs text-on-surface-variant uppercase font-bold mb-1">
                             {sIdx < 2 ? `S${sIdx+1}` : `E${sIdx-1}`}
                           </span>
                           <span className="px-3 py-2 bg-surface-container-highest rounded text-xl font-bold border border-outline-variant/30">
                             {score.toFixed(1)}
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                   
                   <div className="w-48 text-right pl-8 ml-8 border-l border-outline-variant/30">
                     <span className="font-display font-bold text-7xl text-on-surface tabular-nums">
                       {athlete.score.toFixed(1)}
                     </span>
                   </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Eliminated Shooters Table (Takes full width underneath in a real layout, here we just show it) */}
          <div className="bg-surface-container border border-outline-variant/30 rounded-3xl overflow-hidden mt-2 col-span-2 shadow-inner h-64">
             <div className="bg-surface-container-high py-2 px-6 border-b border-outline-variant/30">
               <h3 className="text-lg font-bold text-on-surface-variant uppercase tracking-wider">Eliminated</h3>
             </div>
             <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {scoreboard.filter(s => s.status === 'ELIMINATED').map((athlete) => (
                      <tr key={athlete.name} className="border-b border-outline-variant/10 text-on-surface-variant opacity-70">
                         <td className="p-3 text-center w-16 font-bold">{athlete.rank}</td>
                         <td className="p-3 font-bold text-xl">{athlete.name}</td>
                         <td className="p-3 text-sm">{athlete.club}</td>
                         <td className="p-3 text-right pr-8 font-display font-bold text-2xl">{athlete.score.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
