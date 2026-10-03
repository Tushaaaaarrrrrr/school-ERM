import type { EmployeePayment } from '@/lib/types';

type EmployeeIdentity = { id: string; school_id: string; email?: string; employee_number?: string; auth_user_id?: string };
type PayrollUser = { id: string; email?: string; login_id?: string; teacher_id?: string; staff_id?: string };

export function ownPayrollPayments(payments: EmployeePayment[], employees: EmployeeIdentity[], user: PayrollUser, schoolId: string, type: 'teacher' | 'staff'): EmployeePayment[] {
  const scoped = employees.filter((employee) => employee.school_id === schoolId);
  const linkedId = type === 'teacher' ? user.teacher_id : user.staff_id;
  const linked = scoped.find((employee) => linkedId && employee.id === linkedId);
  const matches = scoped.filter((employee) =>
    (employee.auth_user_id && employee.auth_user_id === user.id) ||
    (user.email && employee.email?.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
    (user.login_id && employee.employee_number?.trim().toLowerCase() === user.login_id.trim().toLowerCase())
  );
  const employee = linked || (matches.length === 1 ? matches[0] : undefined);
  if (!employee) throw new Error('Your payroll employee profile could not be resolved.');
  return payments.filter((payment) => payment.school_id === schoolId && payment.employee_type === type && payment.employee_id === employee.id);
}
