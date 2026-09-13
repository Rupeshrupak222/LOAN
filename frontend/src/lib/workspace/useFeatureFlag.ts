/**
 * Phase 16: Centralized Feature Flag Hook
 */

import { useWorkspace } from './useWorkspace';

export function useFeatureFlag(flagKey: string): boolean {
  const workspace = useWorkspace();
  if (!workspace || !workspace.isFeatureEnabled) {
    return true;
  }
  return workspace.isFeatureEnabled(flagKey);
}
