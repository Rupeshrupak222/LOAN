/**
 * Phase 16: Centralized Feature Flag Hook
 */

import { useWorkspace } from './useWorkspace';

export function useFeatureFlag(flagKey: string): boolean {
  try {
    const { isFeatureEnabled } = useWorkspace();
    return isFeatureEnabled(flagKey);
  } catch {
    return true; // Default fallback to enabled
  }
}
