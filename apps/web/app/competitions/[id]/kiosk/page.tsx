"use client";

import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { useParams } from "next/navigation";

// Simulating live updating scoreboard for Kiosk
const INITIAL_SCOREBOARD = [
  { rank: 1, name: "David C.", club: "Elite Marksmen", score: 628.4, series: [104.5, 105.1, 104.8, 104.2, 105.0, 104.8], lastShot: 10.8 },
  { rank: 2, name: "Sarah L.", club: "State Academy", score: 627.1, series: [103.8, 104.2, 105.5, 104.9, 104.1, 104.6], lastShot: 10.5 },
  { rank: 3, name: "Michael T.", club: "Precision Club", score: 625.5, series: [104.0, 103.5, 104.8, 104.5, 103.9, 104.8], lastShot: 10.2 },
  { rank: 4, name: "Elena R.", club: "Elite Marksmen", score: 624.2, series: [103.1, 104.0, 103.8, 104.7, 104.4, 104.2], lastShot: 10.6 },
  { rank: 5, name: "Robert K.", club: "Independent", score: 621.8, series: [102.5, 103.9, 104.1, 103.5, 103.8, 104.0], lastShot: 9.8 },
  { rank: 6, name: "Jessica W.", club: "National Team", score: 620.1, series: [103.5, 102.9, 104.1, 102.5, 103.8, 103.3], lastShot: 10.1 },
  { rank: 7, name: "Thomas B.", club: "State Academy", score: 618.9, series: [101.5, 103.2, 103.1, 103.5, 103.8, 103.8], lastShot: 10.0 },
  { rank: 8, name: "William H.", club: "Elite Marksmen", score: 615.4, series: [102.5, 102.1, 102.8, 102.2, 103.0, 102.8], lastShot: 9.5 },
];

export default function CompetitionKioskMode() {
  const params = useParams();
  const [scoreboard, setScoreboard] = useState(INITIAL_SCOREBOARD);

  // Simulate live updates over WebSocket
  useEffect(() => {
    // In real implementation, connect to eventsGateway via Socket.io
    // const socket = io(process.env.NEXT_PUBLIC_API_URL);
    // socket.emit('joinCompetitionScoreboard', params.id);
    // socket.on('scoreboard:update', data => setScoreboard(data));
    
    const interval = setInterval(() => {
      setScoreboard(current => {
        const newScoreboard = [...current];
        const randomPlayerIdx = Math.floor(Math.random() * newScoreboard.length);
        const randomShot = (Math.random() * 1.5 + 9.4).toFixed(1); 
        
        newScoreboard[randomPlayerIdx] = {
          ...newScoreboard[randomPlayerIdx],
          lastShot: parseFloat(randomShot),
          score: parseFloat((newScoreboard[randomPlayerIdx].score + 0.1).toFixed(1))
        };
        
        return newScoreboard.sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface-container-lowest min-h-screen text-on-surface font-sans overflow-hidden">
      <div className="flex flex-col h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-5xl font-display font-bold text-on-surface tracking-tight uppercase">Live Scoreboard</h1>
            <h2 className="text-2xl text-primary font-bold mt-1">10m Air Rifle Men - Qualification</h2>
          </div>
          <div className="flex items-center gap-3">
             <span className="bg-[#FF5252]/20 text-[#FF5252] text-xl font-bold uppercase px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                <span className="w-3 h-3 bg-[#FF5252] rounded-full"></span> LIVE
              </span>
          </div>
        </div>

        <div className="flex-1 bg-surface-container border-2 border-outline-variant/30 rounded-3xl overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse whitespace-nowrap h-full table-fixed">
            <thead>
              <tr className="bg-surface-container-high border-b-2 border-outline-variant/50">
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold w-24 text-center">Rank</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold">Athlete</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold text-center">1</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold text-center">2</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold text-center">3</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold text-center">4</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold text-center">5</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface-variant font-bold text-center">6</th>
                <th className="p-6 text-xl font-label-caps uppercase text-primary font-bold text-center bg-primary/10">Last</th>
                <th className="p-6 text-xl font-label-caps uppercase text-on-surface font-bold text-right pr-12 bg-surface-container-highest">Total</th>
              </tr>
            </thead>
            <tbody>
              {scoreboard.map((entry, idx) => (
                <tr 
                  key={entry.name} 
                  className={`border-b border-outline-variant/20 transition-all duration-300 ${
                    idx === 0 ? 'bg-gradient-to-r from-[#FFD700]/15 to-transparent' :
                    idx === 1 ? 'bg-gradient-to-r from-[#C0C0C0]/15 to-transparent' :
                    idx === 2 ? 'bg-gradient-to-r from-[#CD7F32]/15 to-transparent' : ''
                  }`}
                  style={{ height: `${100 / scoreboard.length}%` }}
                >
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center">
                      {idx === 0 ? <Trophy size={32} className="text-[#FFD700]" /> :
                       idx === 1 ? <Trophy size={28} className="text-[#C0C0C0]" /> :
                       idx === 2 ? <Trophy size={24} className="text-[#CD7F32]" /> :
                       <span className="font-display font-bold text-3xl text-on-surface-variant">{entry.rank}</span>}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface text-3xl truncate">{entry.name}</span>
                      <span className="text-on-surface-variant text-lg uppercase tracking-wide font-semibold truncate">{entry.club}</span>
                    </div>
                  </td>
                  {entry.series.map((score, sIdx) => (
                    <td key={sIdx} className="p-6 text-center font-semibold text-on-surface text-2xl">
                      {score.toFixed(1)}
                    </td>
                  ))}
                  <td className="p-6 text-center bg-primary/10">
                    <span className={`inline-block px-4 py-2 rounded-lg font-bold text-3xl ${
                      entry.lastShot >= 10.5 ? 'bg-primary text-on-primary shadow-lg' :
                      entry.lastShot >= 10.0 ? 'bg-primary/20 text-primary' :
                      'bg-surface-container-highest text-on-surface'
                    }`}>
                      {entry.lastShot.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-6 text-right pr-12 bg-surface-container-highest/50">
                    <span className="font-display font-bold text-5xl text-on-surface">{entry.score.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
