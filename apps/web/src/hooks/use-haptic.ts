"use client";

import { useWebHaptics } from "web-haptics/react";

export function useHaptic() {
  return useWebHaptics();
}
