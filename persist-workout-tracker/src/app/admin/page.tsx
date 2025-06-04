// src/app/admin/page.tsx
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import AdminJsonImport from '@/components/ui/AdminJsonImport';

export default function AdminPage() {
  return (
    <AppLayout>
      <AdminJsonImport />
    </AppLayout>
  );
}