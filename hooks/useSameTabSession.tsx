"use client";

import { useEffect, useState } from "react";

const ACTIVE_TAB_ID = "active_tab_id";
const CHANNEL_NAME = "same_tab_session_channel";

function generateTabId(): string {
  // crypto.randomUUID() gives every browser tab a unique ID.
  // Unlike sessionStorage, this ID is NOT copied when duplicating a tab.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

export function useSameTabSession() {
  const [isActiveTab, setIsActiveTab] = useState(false);
  const [tabId, setTabId] = useState<string | null>(null);

  useEffect(() => {
    // Every browser tab gets its own unique ID.
    const currentTabId = generateTabId();

    setTabId(currentTabId);

    /*
     * ---------------------------------------------------------
     * BroadcastChannel
     * ---------------------------------------------------------
     *
     * Used for immediate communication between browser tabs.
     */
    const channel = new BroadcastChannel(CHANNEL_NAME);

    /*
     * ---------------------------------------------------------
     * Make this newly opened tab the active tab
     * ---------------------------------------------------------
     */
    localStorage.setItem(ACTIVE_TAB_ID, currentTabId);

    setIsActiveTab(true);

    /*
     * Tell all other tabs that this tab is now active.
     */
    channel.postMessage({
      type: "NEW_ACTIVE_TAB",
      tabId: currentTabId,
    });

    /*
     * ---------------------------------------------------------
     * Listen for another tab becoming active
     * ---------------------------------------------------------
     */
    const handleBroadcastMessage = (event: MessageEvent) => {
      const { type, tabId: newActiveTabId } = event.data || {};

      if (type !== "NEW_ACTIVE_TAB") {
        return;
      }

      if (newActiveTabId !== currentTabId) {
        setIsActiveTab(false);
      }
    };

    channel.addEventListener("message", handleBroadcastMessage);

    /*
     * ---------------------------------------------------------
     * Fallback using localStorage
     * ---------------------------------------------------------
     *
     * storage event works even if BroadcastChannel is unavailable
     * or another tab changes the value directly.
     */
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== ACTIVE_TAB_ID) {
        return;
      }

      if (event.newValue !== currentTabId) {
        setIsActiveTab(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    /*
     * ---------------------------------------------------------
     * Cleanup
     * ---------------------------------------------------------
     */
    return () => {
      channel.removeEventListener("message", handleBroadcastMessage);
      channel.close();

      window.removeEventListener("storage", handleStorageChange);

      /*
       * Only remove active ID if THIS tab is still the active tab.
       */
      const activeTabId = localStorage.getItem(ACTIVE_TAB_ID);

      if (activeTabId === currentTabId) {
        localStorage.removeItem(ACTIVE_TAB_ID);
      }
    };
  }, []);

  return {
    tabId,
    isActiveTab,
  };
}
