"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Search, Filter, Plus, Target, BookOpen, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MOCK_DRILLS = [
  { id: 1, title: "10m Standing Basics", category: "Technique", duration: "30 mins", level: "Beginner", tags: ["10m Air Rifle", "Standing", "Posture"] },
  { id: 2, title: "Rapid Fire Sequence", category: "Speed", duration: "45 mins", level: "Advanced", tags: ["25m Pistol", "Rapid", "Trigger Control"] },
  { id: 3, title: "Endurance Hold", category: "Conditioning", duration: "60 mins", level: "Intermediate", tags: ["50m Rifle", "Prone", "Breathing"] },
  { id: 4, title: "Dry Fire Trigger Squeeze", category: "Technique", duration: "20 mins", level: "All Levels", tags: ["Pistol", "Dry Fire", "Fundamentals"] },
];

export default function CoachDrills() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout role="COACH">
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in w-full h-full overflow-y-auto pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Drill Library</h1>
            <p className="text-on-surface-variant text-lg mt-1">Manage and assign training exercises.</p>
          </div>
          <Button className="gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
            <Plus size={18} /> Create New Drill
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <Input 
              placeholder="Search drills..." 
              className="pl-10 h-12 bg-surface-container-low border-outline-variant/50 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['All', 'Technique', 'Speed', 'Conditioning'].map(cat => (
              <Button key={cat} variant={cat === 'All' ? 'default' : 'outline'} className={`h-10 rounded-full px-6 whitespace-nowrap ${cat === 'All' ? '' : 'border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high'}`}>
                {cat}
              </Button>
            ))}
            <Button variant="outline" className="h-10 rounded-full border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container-high ml-2">
              <Filter size={16} className="mr-2" /> More Filters
            </Button>
          </div>
        </div>

        {/* Drill Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_DRILLS.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase())).map((drill) => (
            <div key={drill.id} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group flex flex-col justify-between h-full">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-primary">
                    <BookOpen size={24} />
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    drill.level === 'Beginner' ? 'bg-secondary/10 text-secondary' :
                    drill.level === 'Intermediate' ? 'bg-primary/10 text-primary' :
                    drill.level === 'Advanced' ? 'bg-[#FF5252]/10 text-[#FF5252]' : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {drill.level}
                  </span>
                </div>
                
                <h3 className="font-bold text-on-surface text-xl mb-2 group-hover:text-primary transition-colors">{drill.title}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {drill.tags.map(tag => (
                    <span key={tag} className="text-xs font-semibold bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-md flex items-center gap-1 border border-outline-variant/30">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center text-sm font-semibold text-on-surface-variant">
                <span className="flex items-center gap-1"><Target size={16} className="text-tertiary" /> {drill.category}</span>
                <span className="flex items-center gap-1"><Clock size={16} /> {drill.duration}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
