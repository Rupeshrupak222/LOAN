'use client';

import React from 'react';
import { UnauthorizedPage } from '@/components/workspace/UnauthorizedPage';

export default function AccessRestrictedPage() {
  return <UnauthorizedPage moduleName="this workspace or route" />;
}
