'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/common';

// const IDLE_THRESHOLD = 30 * 1000;
// const WARNING_DURATION = 15 * 60 * 1000;

const IDLE_THRESHOLD = 10 * 1000; // 10 seconds

const WARNING_DURATION = 15 * 1000; // 15 seconds

export const useIdleTimeout = () => {
  const router = useRouter();

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const isIdleRef = useRef(false);
  const logoutStartedRef = useRef(false);

  const [isIdle, setIsIdle] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_DURATION);

  const clearIdleTimeout = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  const clearWarningTimer = useCallback(() => {
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }

    isIdleRef.current = false;

    setIsIdle(false);
    setRemainingTime(WARNING_DURATION);
  }, []);

  const logout = useCallback(async () => {
    if (logoutStartedRef.current) {
      return;
    }

    logoutStartedRef.current = true;

    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
    }
  }, [router]);

  const startWarningTimer = useCallback(() => {
    if (logoutStartedRef.current || isIdleRef.current) {
      return;
    }

    isIdleRef.current = true;

    setIsIdle(true);

    const endTime = Date.now() + WARNING_DURATION;

    setRemainingTime(WARNING_DURATION);

    warningIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());

      setRemainingTime(remaining);

      if (remaining <= 0) {
        if (warningIntervalRef.current) {
          clearInterval(warningIntervalRef.current);
          warningIntervalRef.current = null;
        }

        logout();
      }
    }, 1000);
  }, [logout]);

  const resetIdleTimer = useCallback(() => {
    if (logoutStartedRef.current) {
      return;
    }

    clearIdleTimeout();

    /**
     * User became active while the 15-minute
     * warning timer was visible.
     */
    if (isIdleRef.current) {
      clearWarningTimer();
    }

    /**
     * Start a new 30-second inactivity timer.
     */
    idleTimeoutRef.current = setTimeout(() => {
      startWarningTimer();
    }, IDLE_THRESHOLD);
  }, [clearWarningTimer, startWarningTimer]);

  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Start detecting inactivity when page loads.
    resetIdleTimer();

    return () => {
      clearIdleTimeout();

      if (warningIntervalRef.current) {
        clearInterval(warningIntervalRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [resetIdleTimer]);

  return {
    isIdle,
    remainingTime,
    totalWarningTime: WARNING_DURATION,
  };
};