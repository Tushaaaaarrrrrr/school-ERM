import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['driver', 'staff', 'school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const schoolId = access.schoolId;
    const userEmail = access.context.user?.email || access.context.profile?.email;
    
    // Get all staff, vehicles, routes, stops, assignments, students for this school
    const [staffList, vehicles, routes, stops, assignments, students] = await Promise.all([
      serverDb.getStaff(schoolId),
      // @ts-ignore
      serverDb.getVehicles(schoolId),
      // @ts-ignore
      serverDb.getTransportRoutes(schoolId),
      // @ts-ignore
      serverDb.getTransportStops(schoolId),
      // @ts-ignore
      serverDb.getTransportAssignments(schoolId),
      serverDb.getStudents(schoolId),
    ]);
    
    // Find the driver staff record by email (case-insensitive) or user profile ID
    const driver = staffList.find(s => 
      (userEmail && s.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) ||
      (s.id === access.context.user?.id) ||
      (s.auth_user_id && s.auth_user_id === access.context.user?.id)
    ) || null;

    const driverName = driver ? `${driver.first_name} ${driver.last_name}`.trim().toLowerCase() : (access.context.user?.name || '').trim().toLowerCase();
    
    // Find vehicle assigned to this driver by UUID, email, employee number, or full name
    const vehicle = vehicles.find((v: any) => {
      if (driver && v.driver_id && (v.driver_id === driver.id || v.driver_id === driver.employee_number)) return true;
      if (userEmail && v.driver_id && v.driver_id.toLowerCase().trim() === userEmail.toLowerCase().trim()) return true;
      if (driverName && v.driver_name && v.driver_name.toLowerCase().trim() === driverName) return true;
      return false;
    }) || null;
    
    // Find routes assigned to this vehicle OR directly to this driver
    const driverRoutes = vehicle ? routes.filter((r: any) => r.assigned_vehicle_id === vehicle.id || (r.vehicle_id && r.vehicle_id === vehicle.id)) : [];
    
    // Find stops for those routes
    const routeIds = driverRoutes.map((r: any) => r.id);
    const driverStops = stops.filter((s: any) => routeIds.includes(s.route_id));
    driverStops.sort((a: any, b: any) => (a.stop_order || 0) - (b.stop_order || 0));
    
    // Find student assignments for those routes
    const driverAssignments = assignments.filter((a: any) => routeIds.includes(a.route_id) && a.status === 'active');
    
    // Get relevant assigned students
    const assignedStudentIds = driverAssignments.map((a: any) => a.student_id);
    const assignedStudents = students.filter(s => assignedStudentIds.includes(s.id));

    // Format students with their stop and assignment
    const formattedStudents = assignedStudents.map(student => {
      const assignment = driverAssignments.find((a: any) => a.student_id === student.id);
      const stop = stops.find((s: any) => s.id === assignment?.stop_id);
      return {
        ...student,
        assignment,
        stop,
        transport_assignment: assignment,
      };
    });
    
    // Get school info
    const school = await serverDb.getSchoolById(schoolId);
    
    return NextResponse.json({
      success: true,
      data: {
        driver: driver || null,
        vehicle: vehicle || null,
        route: driverRoutes[0] || null,
        routes: driverRoutes,
        stops: driverStops,
        assignments: driverAssignments,
        students: formattedStudents,
        school,
      }
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    );
  }
}
