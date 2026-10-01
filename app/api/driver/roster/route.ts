import { NextResponse } from 'next/server';
import { stripSchoolSecrets } from '@/lib/server/sanitize';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';
import { getAssignedDriverTransport } from '@/lib/server/driver-access';

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['driver', 'school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const schoolId = access.schoolId;
    const ctx = access.context as any;
    
    // Get all staff, vehicles, routes, stops, assignments, students for this school
    const [{ driver, vehicle, routes: driverRoutes }, stops, assignments, students] = await Promise.all([
      access.role === 'driver'
        ? getAssignedDriverTransport(schoolId, ctx)
        : (async () => {
            const [vehicles, routes] = await Promise.all([
              // @ts-ignore
              serverDb.getVehicles(schoolId),
              // @ts-ignore
              serverDb.getTransportRoutes(schoolId),
            ]);
            const vehicle = vehicles[0] || null;
            return { driver: null, vehicle, routes: vehicle ? routes.filter((r: any) => r.assigned_vehicle_id === vehicle.id || r.vehicle_id === vehicle.id) : [] };
          })(),
      // @ts-ignore
      serverDb.getTransportStops(schoolId),
      // @ts-ignore
      serverDb.getTransportAssignments(schoolId),
      serverDb.getStudents(schoolId),
    ]);

    if (access.role === 'driver' && (!driver || !vehicle || driverRoutes.length === 0)) {
      return NextResponse.json({ success: false, error: 'Driver is not assigned to an active route.' }, { status: 403 });
    }
    
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
        photo_url: student.photo_url || (student as any).profile_photo_url || (student as any).image_url || ((student as any).avatar?.startsWith?.('http') ? (student as any).avatar : undefined),
        assignment,
        stop,
        transport_assignment: assignment,
      };
    });
    
    // Get school info
    const school = stripSchoolSecrets(await serverDb.getSchoolById(schoolId));
    
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
