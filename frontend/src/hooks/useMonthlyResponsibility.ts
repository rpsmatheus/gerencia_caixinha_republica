/**
 * Hook que verifica se o usuário autenticado é responsável para um dado mês.
 * Admin sempre retorna isResponsible = true.
 */

import { useState, useEffect } from 'react';
import { monthlyResponsibleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UseMonthlyResponsibilityResult {
  isResponsible: boolean;
  loading: boolean;
}

export function useMonthlyResponsibility(monthKey: string): UseMonthlyResponsibilityResult {
  const { resident } = useAuth();
  const [isResponsible, setIsResponsible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resident) {
      setIsResponsible(false);
      setLoading(false);
      return;
    }

    // Admin é sempre responsável
    if (resident.role === 'admin') {
      setIsResponsible(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    monthlyResponsibleAPI
      .checkMe(monthKey)
      .then((res) => {
        if (!cancelled) {
          setIsResponsible(res.data.data.isResponsible);
        }
      })
      .catch(() => {
        if (!cancelled) setIsResponsible(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resident, monthKey]);

  return { isResponsible, loading };
}
