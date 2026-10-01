'use client';

// ============================================================================
// Student Portal – Live Transport, Bus, Pickup Point & Driver Status
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { transportService, studentService, staffService } from '@/lib/services/api';
import { Vehicle, TransportRoute, StudentTransportAssignment, StudentTransportEvent, Staff } from '@/lib/types';
import { formatTime, formatDate } from '@/lib/utils/formatters';
import { Bus, MapPin, Clock, CheckCircle2, AlertCircle, Shield, User, Phone, PhoneCall, Building2 } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function StudentTransportPage() {
  const { currentUser } = useAuth();
  const schoolId = currentUser?.school_id || '';

  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<StudentTransportAssignment | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [driver, setDriver] = useState<Staff | null>(null);
  const [todayStatus, setTodayStatus] = useState<StudentTransportEvent | null>(null);

  useEffect(() => {
    async function loadTransportInfo() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const student = await studentService.getStudentById(currentUser.id);
        const asgn = student?.transport_assignment || null;
        setAssignment(asgn);

        let vObj: Vehicle | null = null;
        if (asgn?.vehicle_id) {
          const vehicles = await transportService.getVehicles(schoolId);
          vObj = vehicles.find((x) => x.id === asgn.vehicle_id) || null;
          setVehicle(vObj);
        }

        if (asgn?.route_id) {
          const routes = await transportService.getRoutes(schoolId);
          const r = routes.find((x) => x.id === asgn.route_id) || null;
          setRoute(r);
        }

        const driverId = vObj?.driver_id;
        if (driverId) {
          const drivers = await staffService.getStaff(schoolId, { staffType: 'driver' });
          const d = drivers.find((drv) => drv.id === driverId || drv.email === driverId) || null;
          setDriver(d);
        }

        const todayEvt = await transportService.getStudentTodayTransportStatus(currentUser.id, schoolId);
        setTodayStatus(todayEvt.todayEvent);
      } catch (err) {
        console.error('Failed to load transport details', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTransportInfo();
  }, [currentUser, schoolId]);

  if (isLoading) {
    return (
      <div className="space-y-4 text-left w-full">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const driverPhone = driver?.phone || vehicle?.driver_phone || assignment?.driver_phone || '';
  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : vehicle?.driver_name || assignment?.driver_name || 'Assigned Driver';
  const driverPhoto = driver?.photo_url && !driver.photo_url.includes('images.unsplash.com') ? driver.photo_url : null;
  const cityName = assignment?.city || route?.city || 'School Area';

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bus className="w-6 h-6 text-indigo-600" /> My School Transport
        </h1>
      </div>

      {!assignment || !assignment.pickup_enabled ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-3">
          <Bus className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">School Transport Not Assigned</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You are currently not enrolled in school bus transportation. Contact the school administrative office if you need transport service.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: TODAY'S LIVE STATUS & PICKUP DETAILS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Today&apos;s Run Status
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {formatDate(new Date().toISOString().split('T')[0])}
              </span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50/70 border-slate-200/80 space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Morning Pickup Status:</span>

              {todayStatus?.event_type === 'picked_up' ? (
                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-100/60 p-3 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                  <div>
                    <span className="text-sm font-bold block">Picked Up by Bus</span>
                    <span className="text-xs text-emerald-800">Recorded at {formatTime(todayStatus.event_time)}</span>
                  </div>
                </div>
              ) : todayStatus?.event_type === 'not_riding' ? (
                <div className="flex items-center gap-3 text-slate-700 bg-slate-100 p-3 rounded-xl border border-slate-300">
                  <AlertCircle className="w-6 h-6 shrink-0 text-slate-500" />
                  <div>
                    <span className="text-sm font-bold block">Not Riding Today</span>
                    <span className="text-xs text-slate-500">Marked by driver at {formatTime(todayStatus.event_time)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <Clock className="w-6 h-6 shrink-0 text-amber-600" />
                  <div>
                    <span className="text-sm font-bold block">Pickup Pending</span>
                    <span className="text-xs text-amber-700">
                      Expected at {formatTime(assignment.estimated_pickup_time || '07:20 AM')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Transport Route Details */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> City / Zone
                </span>
                <span className="font-bold text-indigo-700">{cityName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Route Name</span>
                <span className="font-bold text-slate-900">{route?.route_name || assignment.route_name || 'Main Route'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Pickup Point
                </span>
                <span className="font-bold text-slate-900">{assignment.stop_name || 'Designated Stop'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Expected Morning Pickup</span>
                <span className="font-mono font-bold text-indigo-600">
                  {formatTime(assignment.estimated_pickup_time || '07:20 AM')}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: ASSIGNED DRIVER & VEHICLE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Your Bus & Driver
            </span>

            {/* Driver Profile */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 shadow-xs uppercase">
                {driverPhoto ? (
                  <img src={driverPhoto} alt={driverName} className="w-full h-full object-cover" />
                ) : (
                  (driverName[0] || 'D')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  Assigned Driver
                </span>
                <h3 className="text-base font-extrabold text-slate-900 truncate capitalize">
                  {driverName}
                </h3>
                {driverPhone ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{driverPhone}</span>
                    <a
                      href={`tel:${driverPhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      <PhoneCall className="w-3 h-3" /> Call Driver
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Driver contact on file with school</span>
                )}
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vehicle Name:</span>
                <span className="font-bold text-slate-900">{vehicle?.vehicle_name || assignment.vehicle_name || 'School Bus'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registration / Plate No:</span>
                <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-white rounded border border-slate-200">
                  {vehicle?.vehicle_number || assignment.vehicle_number || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Safety Verification:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Active School Fleet
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
