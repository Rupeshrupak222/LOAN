'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Shield, Building2, Search } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input, Card } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatDate, cn } from '@/lib/utils';

interface UserRow {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  roles: string[];
  branch?: string;
  status: string;
  lastLoginAt?: string;
}

export default function UsersPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleName, setRoleName] = useState('LOAN_OFFICER');
  const [employeeId, setEmployeeId] = useState('');
  const [branchId, setBranchId] = useState('');

  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      const res = await api.get('/branches');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const res = await api.get('/users', { params: { search: search || undefined } });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as UserRow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post('/users', {
        email,
        firstName,
        lastName,
        roleName,
        employeeId: employeeId || undefined,
        branchId: branchId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setEmployeeId('');
      setBranchId('');
    },
  });

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Staff Name',
      render: (r) => (
        <div>
          <p className={cn("font-semibold leading-tight text-xs sm:text-sm", isDark ? "text-white" : "text-slate-900")}>{r.name || 'Staff User'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{r.email}</p>
        </div>
      ),
    },
    { key: 'employeeId', header: 'Employee ID', render: (r) => <span className={cn("font-mono text-xs", isDark ? "text-slate-300" : "text-slate-600")}>{r.employeeId || '-'}</span> },
    {
      key: 'roles',
      header: 'Assigned Role',
      render: (r) => (
        <span className={cn(
          "font-bold px-2 py-0.5 rounded text-xs border",
          isDark ? "bg-[#2563EB]/20 text-[#60A5FA] border-[#2B3566]" : "bg-blue-50 text-[#2563EB] border-blue-200"
        )}>
          {Array.isArray(r.roles) ? r.roles.join(', ') : String(r.roles || 'USER')}
        </span>
      ),
    },
    { key: 'branch', header: 'Branch Office', render: (r) => <span className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{r.branch || 'Head Office'}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'lastLoginAt', header: 'Last Active', render: (r) => <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>{r.lastLoginAt ? formatDate(r.lastLoginAt) : 'Never'}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Administration / Staff Users"
        title="Staff Directory & RBAC Management"
        subtitle="Manage employees, officer roles, branch assignments, and system access"
        action={
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 text-white">
            <UserPlus className="h-4 w-4" /> Add Staff Member
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder="Search staff by name, email, or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No staff users found"
        emptyDescription="Add staff members and assign roles to grant access to the LMS."
      />

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className={cn(
            "w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-fade-in space-y-4",
            isDark ? "bg-[#1E2445] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Add New Staff Member</h3>
              <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>Initial default login password: <code>Passw0rd!123</code></p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Corporate Email</label>
                <Input type="email" placeholder="user@adyapan.dev" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Employee ID</label>
                <Input placeholder="e.g. EMP010" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Assigned LMS Role</label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="LOAN_OFFICER">Loan Officer (Origination)</option>
                  <option value="CREDIT_ANALYST">Credit Analyst (Scoring & KYC)</option>
                  <option value="UNDERWRITER">Underwriter (Sanctions)</option>
                  <option value="FINANCE_OFFICER">Finance Officer (Disbursements & Payments)</option>
                  <option value="COLLECTION_OFFICER">Collection Officer (Delinquency & Recovery)</option>
                  <option value="BRANCH_MANAGER">Branch Manager (Branch Oversight)</option>
                  <option value="AUDITOR">Auditor (Compliance & Ledger)</option>
                  <option value="ADMIN">System Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Branch Assignment</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="">Headquarters / Corporate HQ (Default)</option>
                  {Array.isArray(branchesData) &&
                    branchesData.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) - {b.city || 'Regional'}
                      </option>
                    ))}
                </select>
              </div>

              {createMutation.isError && (
                <div className={cn(
                  "rounded-xl p-3 text-xs border",
                  isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {apiErrorMessage(createMutation.error)}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button disabled={!email.trim() || !firstName.trim() || createMutation.isPending} onClick={() => createMutation.mutate()} className="flex-1 text-white">
                  {createMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
