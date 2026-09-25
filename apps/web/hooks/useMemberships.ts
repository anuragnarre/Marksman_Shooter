import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

export interface ShooterProfile {
  id: string;
  shooterCode: string;
  user?: {
    name: string;
    email: string;
  };
  tier: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  createdAt: string;
  primaryWeapon: string;
  totalHours: number;
  safetyScore: number;
  incidents: number;
  callsign?: string;
  expirationDate?: string;
  // Performance Metrics (Squad Comparative Table)
  avgScore30d?: number;
  bestScore?: number;
  groupRadius?: number;
  consistency?: number;
  sessionsLogged?: number;
  lastActiveDate?: string;
}

export interface MembershipTier {
  id: string;
  name: string;
  price: number;
  benefits: string[];
}

const MOCK_PROFILES: ShooterProfile[] = [
  {
    id: 'MEM-88029-VIP',
    shooterCode: '88029-VIP',
    user: { name: 'Marcus Vance', email: 'marcus@example.com' },
    tier: 'OBSIDIAN VIP',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 365 * 86400000 * 2).toISOString(),
    primaryWeapon: 'NFA Auto',
    totalHours: 68.4,
    safetyScore: 100,
    incidents: 0,
    callsign: 'VANGUARD-01',
    expirationDate: '11/26',
    avgScore30d: 9.6,
    bestScore: 10.9,
    groupRadius: 1.2,
    consistency: 94,
    sessionsLogged: 142,
    lastActiveDate: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'MEM-99214-GLD',
    shooterCode: '99214-GLD',
    user: { name: 'Sarah Connor', email: 'sarah@example.com' },
    tier: 'GOLD TIER',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
    primaryWeapon: '9mm Handgun',
    totalHours: 24.5,
    safetyScore: 98,
    incidents: 0,
    callsign: 'SC-99',
    expirationDate: '04/25',
    avgScore30d: 8.8,
    bestScore: 10.2,
    groupRadius: 2.1,
    consistency: 85,
    sessionsLogged: 45,
    lastActiveDate: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'MEM-11045-TAC',
    shooterCode: '11045-TAC',
    user: { name: 'John Wick', email: 'john@example.com' },
    tier: 'TACTICAL CLUB',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 800 * 86400000).toISOString(),
    primaryWeapon: 'Multi-Cal',
    totalHours: 420.0,
    safetyScore: 100,
    incidents: 0,
    callsign: 'BABA-YAGA',
    expirationDate: '01/27',
    avgScore30d: 10.2,
    bestScore: 10.9,
    groupRadius: 0.8,
    consistency: 99,
    sessionsLogged: 405,
    lastActiveDate: new Date(Date.now() - 0 * 86400000).toISOString(),
  }
];

const MOCK_TIERS: MembershipTier[] = [
  { id: 't1', name: 'OBSIDIAN VIP', price: 299, benefits: ['All lanes', 'Unlimited'] },
  { id: 't2', name: 'GOLD TIER', price: 99, benefits: ['Standard lanes', '2 hours/day'] },
  { id: 't3', name: 'TACTICAL CLUB', price: 149, benefits: ['Tactical lanes', 'Unlimited'] },
];

export function useMemberships() {
  const [members, setMembers] = useState<ShooterProfile[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [membersRes, tiersRes] = await Promise.allSettled([
        apiFetch<ShooterProfile[]>('/shooter-profile/all'),
        apiFetch<MembershipTier[]>('/memberships/tiers')
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value?.length) {
        setMembers(membersRes.value);
      } else {
        setMembers(MOCK_PROFILES);
      }

      if (tiersRes.status === 'fulfilled' && tiersRes.value?.length) {
        setTiers(tiersRes.value);
      } else {
        setTiers(MOCK_TIERS);
      }
    } catch (err) {
      setError('Failed to load membership data');
      setMembers(MOCK_PROFILES);
      setTiers(MOCK_TIERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = searchQuery === '' || 
        member.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        member.shooterCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.callsign?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesTier = !selectedTier || member.tier === selectedTier;

      return matchesSearch && matchesTier;
    });
  }, [members, searchQuery, selectedTier]);

  return {
    members,
    filteredMembers,
    tiers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedTier,
    setSelectedTier,
    refetch: fetchData
  };
}
