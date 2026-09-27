'use client';

// ============================================================================
// Fee Structures Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { feeService } from '@/lib/services/api';
import { FeeStructure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils/formatters';
import { IndianRupee, Plus } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function FeeStructuresPage() {
  const { currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('2000');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annually' | 'one_time'>('monthly');
  const [dueDay, setDueDay] = useState('10');

  const loadStructures = async () => {
    setIsLoading(true);
    try {
      const data = await feeService.getFeeStructures(schoolId);
      setStructures(data);
    } catch {
      toastError('Failed to load fee structures');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, [schoolId]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(amount) <= 0) return;

    try {
      await feeService.createFeeStructure({
        school_id: schoolId,
        academic_year_id: yearId,
        name: name.trim(),
        amount: Number(amount),
        billing_frequency: frequency,
        due_day: Number(dueDay) || 10,
      });

      success(`Fee structure "${name}" created!`);
      setIsModalOpen(false);
      setName('');
      loadStructures();
    } catch {
      toastError('Failed to create fee structure');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Structures</h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Fee Structure
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : structures.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <IndianRupee className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">No fee structures configured yet.</p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add Default Tuition Fee
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {structures.map((fs) => (
            <div
              key={fs.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{fs.name}</h3>
                  <StatusBadge status={fs.status} />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-indigo-600">
                  {formatCurrency(fs.amount)}
                </div>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-700">Frequency:</span>{' '}
                    <span className="capitalize">{fs.billing_frequency}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Due Day:</span> Every {fs.due_day}th of the month
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Fee Structure"
        description="e.g. Monthly Tuition Fee, Laboratory Fee, Transport Fee"
      >
        <form onSubmit={handleCreateStructure} className="space-y-4 text-left">
          <Input
            label="Structure Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Tuition Fee"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
            />

            <Select
              label="Billing Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
              <option value="one_time">One Time</option>
            </Select>
          </div>

          <Input
            label="Due Day of Month"
            type="number"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            min={1}
            max={31}
            helperText="e.g. 10th of every month"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Fee Structure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
