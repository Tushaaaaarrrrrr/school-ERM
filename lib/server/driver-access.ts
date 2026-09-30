import { serverDb } from '@/lib/server/db';

export async function getAssignedDriverTransport(schoolId: string, context: any) {
  const email = (context.user?.email || context.profile?.email || '').toLowerCase().trim();
  const userId = context.user?.id;
  const staff = await serverDb.getStaff(schoolId, { staff_type: 'driver' });
  const driver = staff.find((s: any) =>
    (email && s.email?.toLowerCase().trim() === email) ||
    s.id === userId ||
    s.auth_user_id === userId
  ) || null;

  if (!driver || driver.status === 'inactive' || driver.portal_access === false) {
    return { driver: null, vehicle: null, routes: [] as any[] };
  }

  const vehicles = await serverDb.getVehicles(schoolId);
  const vehicle = vehicles.find((v: any) => v.driver_id === driver.id || v.driver_id === driver.employee_number) || null;
  const routes = vehicle
    ? (await serverDb.getTransportRoutes(schoolId)).filter((r: any) => r.assigned_vehicle_id === vehicle.id || r.vehicle_id === vehicle.id)
    : [];

  return { driver, vehicle, routes };
}
