import React from 'react';

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="system-admin-layout">
      {children}
    </div>
  );
}