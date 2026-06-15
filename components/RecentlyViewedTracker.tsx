"use client";

import { useEffect } from "react";

const KEY = "awaken_rv";
const MAX = 6;

export default function RecentlyViewedTracker({ productName }: { productName: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      // Remove duplicate then prepend
      const updated = [productName, ...list.filter((n) => n !== productName)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [productName]);

  return null;
}
