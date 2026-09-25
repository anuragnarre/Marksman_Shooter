// hooks/usePayments.ts
// Unified payments data hook — fetches billing history and subscription plans
// from the API, falls back to structured mock data when the endpoint is unavailable.

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'REFUNDED';
  invoiceUrl?: string;
  memberId?: string;
  memberName?: string;
  method?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'annual';
  features: string[];
  isActive: boolean;
  isCurrent?: boolean;
}

export interface PaymentsState {
  billingHistory: BillingRecord[];
  subscriptionPlans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Fallback mock data for demonstration when API is unavailable
const MOCK_BILLING: BillingRecord[] = [
  {
    id: 'INV-001',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Range Session — Lane 01 (60 min)',
    amount: 25.00,
    currency: 'USD',
    status: 'PAID',
    memberName: 'Markus Rossi',
    method: 'Card',
  },
  {
    id: 'INV-002',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Monthly Membership — Gold Tier',
    amount: 79.99,
    currency: 'USD',
    status: 'PAID',
    memberName: 'Jana Kovac',
    method: 'Bank Transfer',
  },
  {
    id: 'INV-003',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'PCP Air Tank Refill x2',
    amount: 16.00,
    currency: 'USD',
    status: 'PAID',
    memberName: 'D. Miller',
    method: 'Cash',
  },
  {
    id: 'INV-004',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Range Session — Lane 03 (120 min)',
    amount: 45.00,
    currency: 'USD',
    status: 'PENDING',
    memberName: 'B. Zhao',
    method: 'Invoice',
  },
  {
    id: 'INV-005',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Quarterly Membership — Silver Tier',
    amount: 149.99,
    currency: 'USD',
    status: 'OVERDUE',
    memberName: 'R. Patel',
    method: 'Card',
  },
  {
    id: 'INV-006',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Match Pellet Tin (500ct) x3',
    amount: 45.00,
    currency: 'USD',
    status: 'PAID',
    memberName: 'A. Vane',
    method: 'Card',
  },
];

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-basic',
    name: 'Recruit',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      '4 range sessions/month',
      'Standard lanes only',
      'Basic scoring system',
      'Email support',
    ],
    isActive: true,
    isCurrent: false,
  },
  {
    id: 'plan-silver',
    name: 'Silver',
    price: 59.99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      '10 range sessions/month',
      'All lane types',
      'Advanced scoring & telemetry',
      'Priority booking',
      'Priority support',
    ],
    isActive: true,
    isCurrent: false,
  },
  {
    id: 'plan-gold',
    name: 'Gold',
    price: 99.99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Unlimited range sessions',
      'All lane types + Competition lanes',
      'Full telemetry suite',
      'Priority booking + walk-in guarantee',
      'PCP air fills included (2/mo)',
      '1-on-1 RSO consultation',
      'Dedicated support line',
    ],
    isActive: true,
    isCurrent: true,
  },
  {
    id: 'plan-elite',
    name: 'Elite / Club',
    price: 199.99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Everything in Gold',
      'Reserved private bay (4 hrs/mo)',
      'Unlimited PCP air fills',
      'Club competition entry included',
      'Locker storage included',
      'Guest passes (2/mo)',
      '24/7 emergency RSO access',
    ],
    isActive: true,
    isCurrent: false,
  },
];

export function usePayments(): PaymentsState {
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get real data from the API
      const [billing, plans] = await Promise.allSettled([
        apiFetch<BillingRecord[]>('/payments/billing-history'),
        apiFetch<SubscriptionPlan[]>('/payments/subscription-plans'),
      ]);

      if (billing.status === 'fulfilled' && billing.value?.length) {
        setBillingHistory(billing.value);
      } else {
        // API not yet implemented — fall back to mock data
        setBillingHistory(MOCK_BILLING);
      }

      if (plans.status === 'fulfilled' && plans.value?.length) {
        setSubscriptionPlans(plans.value);
      } else {
        setSubscriptionPlans(MOCK_PLANS);
      }
    } catch (err) {
      setError('Failed to load payment data');
      setBillingHistory(MOCK_BILLING);
      setSubscriptionPlans(MOCK_PLANS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentPlan = subscriptionPlans.find(p => p.isCurrent) ?? null;

  const totalRevenue = billingHistory
    .filter(b => b.status === 'PAID')
    .reduce((sum, b) => sum + b.amount, 0);

  const pendingAmount = billingHistory
    .filter(b => b.status === 'PENDING')
    .reduce((sum, b) => sum + b.amount, 0);

  const overdueAmount = billingHistory
    .filter(b => b.status === 'OVERDUE')
    .reduce((sum, b) => sum + b.amount, 0);

  return {
    billingHistory,
    subscriptionPlans,
    currentPlan,
    totalRevenue,
    pendingAmount,
    overdueAmount,
    isLoading,
    error,
    refetch: fetchData,
  };
}
