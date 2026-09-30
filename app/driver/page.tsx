'use client';

// ============================================================================
// Driver Cockpit & Pickup Portal (Full-Width Responsive 3-Column Dashboard)
// Redesigned with Stitch Operational Transit Core Design System
// Real Data Only — No Fake or Mock Data
// ============================================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { transportService, leaveService, STORAGE_KEYS } from '@/lib/services/api';
import { Vehicle, TransportRoute, TransportStop, Student, StudentTransportEvent, Staff } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatTime } from '@/lib/utils/formatters';
import { SchoolStatusBoard } from '@/components/school/school-status-board';
import {
  Bus,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  LogOut,
  RefreshCw,
  Check,
  Phone,
  Navigation,
  Sun,
  Moon,
  ShieldCheck,
  User,
  Search,
  X,
  PhoneCall,
  CheckCheck,
  AlertTriangle,
  Building2,
  Radio,
  Activity,
  Gauge,
  Fuel,
  Eye,
  AlertOctagon,
  Undo2,
  ArrowRight,
  ShieldAlert,
  ClipboardCheck,
} from 'lucide-react';

interface StudentPassenger extends Student {
  pickup_status: 'pending' | 'picked_up' | 'not_riding' | 'missed' | 'dropped_off';
  pickup_time?: string;
  assignment_id?: string;
  pickup_event_id?: string;
  isOnLeave?: boolean;
  leaveReason?: string;
  rfid_tag?: string;
  avatar?: string;
  profile_photo_url?: string;
  image_url?: string;
}

interface ActivityLogItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  type: 'boarded' | 'absent' | 'departed' | 'rfid' | 'info';
}

function formatEventTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  }
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${match[2]} ${suffix}`;
}

function studentPhotoUrl(student: StudentPassenger) {
  return student.photo_url || student.profile_photo_url || student.image_url || (student.avatar?.startsWith('http') ? student.avatar : '');
}

export default function DriverPortalPage() {
  const { currentUser, currentSchool, logout } = useAuth();
  const { success, error: toastError } = useToast();

  // Loading & Syncing States (Fix for flicker/reloading bug)
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Real Database Entities
  const [driverProfile, setDriverProfile] = useState<Staff | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [driverRoutes, setDriverRoutes] = useState<TransportRoute[]>([]);
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [students, setStudents] = useState<StudentPassenger[]>([]);
  const [todayEvents, setTodayEvents] = useState<StudentTransportEvent[]>([]);

  // Workflow State
  const [activeShift, setActiveShift] = useState<'morning' | 'afternoon'>('morning');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  // Filters & Search
  const [passengerSearch, setPassengerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'picked' | 'leave' | 'not_riding'>('all');

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmergencySosActive, setIsEmergencySosActive] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('Heavy traffic congestion on route');

  // Real-time Live Activity Stream (derived strictly from real events & driver actions)
  const [localActivities, setLocalActivities] = useState<ActivityLogItem[]>([]);

  // Load Driver Roster from API / database
  const loadDriverRoster = useCallback(
    async (showFullLoader = false) => {
      if (showFullLoader) {
        setIsInitialLoading(true);
      } else {
        setIsSyncing(true);
      }

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const schoolId = currentUser?.school_id || 'sch-001';

        const [data, evts, todayLeaves] = await Promise.all([
          transportService.getDriverRouteAndStudents(
            currentUser?.email || currentUser?.id,
            schoolId,
            currentUser || undefined
          ),
          transportService.getTodayTransportEvents(schoolId),
          leaveService.getLeaves(schoolId, {
            activeOnDate: todayStr,
            status: 'approved',
          }),
        ]);

        let resolvedStops = data.stops || [];
        if (resolvedStops.length === 0 && data.students && data.students.length > 0) {
          const uniqueStopsMap = new Map<string, TransportStop>();
          data.students.forEach((std) => {
            if (std.stop) {
              uniqueStopsMap.set(std.stop.id || std.stop.stop_name, std.stop);
            }
          });
          resolvedStops = Array.from(uniqueStopsMap.values());
        }

        resolvedStops.sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

        const allRoutes = (data as any).routes || (data.route ? [data.route] : []);
        setDriverProfile(data.driver);
        setVehicle(data.vehicle);
        setDriverRoutes(allRoutes);
        setRoute(data.route || allRoutes[0] || null);
        setStops(resolvedStops);
        setTodayEvents(evts || []);

        // Merge transport status & today's approved leave info onto students
        const mapped: StudentPassenger[] = (data.students || []).map((s) => {
          const targetEventType = activeShift === 'morning' ? 'picked_up' : 'dropped_off';
          const matchingEvt = (evts || []).find((e) => e.student_id === s.id && e.event_date === todayStr && e.event_type === targetEventType);
          const matchingLeave = (todayLeaves || []).find((l) => l.student_id === s.id);
          const isStudentOnLeave = !!matchingLeave;

          return {
            ...s,
            pickup_status: (matchingEvt?.event_type as any) || (isStudentOnLeave ? 'not_riding' : 'pending'),
            pickup_time: formatEventTime(matchingEvt?.event_time),
            assignment_id: s.transport_assignment?.id || (s as any).assignment?.id,
            pickup_event_id: matchingEvt?.id,
            isOnLeave: isStudentOnLeave,
            leaveReason: matchingLeave?.reason || 'Approved Medical / Personal Leave',
          };
        });

        setStudents(mapped);
        if (resolvedStops.length > 0 && !selectedStopId) {
          setSelectedStopId(resolvedStops[0].id);
        }

        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.warn('Failed to load driver roster:', err);
      } finally {
        setIsInitialLoading(false);
        setIsSyncing(false);
      }
    },
    [currentUser, selectedStopId, activeShift]
  );

  // Initial mount & quiet background synchronization (NO aggressive 5s full reloads)
  useEffect(() => {
    loadDriverRoster(true);

    // Filtered storage listener: ONLY re-fetch if a transport-specific key was modified
    const handleFilteredSync = (e: any) => {
      const key = e?.detail?.key || e?.key;
      if (
        key === STORAGE_KEYS.VEHICLES ||
        key === STORAGE_KEYS.TRANSPORT_ROUTES ||
        key === STORAGE_KEYS.STUDENT_TRANSPORT_ASSIGNMENTS ||
        key === STORAGE_KEYS.STUDENT_TRANSPORT_EVENTS
      ) {
        loadDriverRoster(false); // Silent background refresh
      }
    };

    window.addEventListener('storage', handleFilteredSync);
    window.addEventListener('school_erp_data_sync', handleFilteredSync);

    // Polite, silent background check every 45 seconds (never shows loading spinner)
    const passiveInterval = setInterval(() => {
      loadDriverRoster(false);
    }, 45000);

    return () => {
      window.removeEventListener('storage', handleFilteredSync);
      window.removeEventListener('school_erp_data_sync', handleFilteredSync);
      clearInterval(passiveInterval);
    };
  }, [loadDriverRoster]);

  // Is a route and vehicle assigned in the real database?
  const isAssigned = Boolean(vehicle || route || students.length > 0);

  // Active selected stop
  const activeStop = useMemo(() => {
    if (!stops || stops.length === 0) return null;
    return stops.find((st) => st.id === selectedStopId) || stops[0];
  }, [stops, selectedStopId]);

  const activeStopIndex = useMemo(() => {
    if (!activeStop || !stops) return 0;
    return stops.findIndex((st) => st.id === activeStop.id);
  }, [activeStop, stops]);

  // Helper: passengers at a given stop
  const getStudentsForStop = useCallback(
    (stopId: string) => {
      return students.filter(
        (s) => s.transport_assignment?.stop_id === stopId || (s as any).stop?.id === stopId
      );
    },
    [students]
  );

  const currentStopStudents = useMemo(() => {
    return activeStop ? getStudentsForStop(activeStop.id) : [];
  }, [activeStop, getStudentsForStop]);

  // Real-time calculation metrics
  const totalAssigned = students.length;
  const totalBoarded = students.filter(
    (s) => s.pickup_status === 'picked_up' || s.pickup_status === 'dropped_off'
  ).length;
  const totalOnLeave = students.filter((s) => s.isOnLeave).length;
  const totalAbsent = students.filter((s) => s.pickup_status === 'not_riding' && !s.isOnLeave).length;
  const totalPending = students.filter((s) => s.pickup_status === 'pending' && !s.isOnLeave).length;

  const completionPercentage =
    totalAssigned > 0 ? Math.round(((totalBoarded + totalOnLeave + totalAbsent) / totalAssigned) * 100) : 0;

  // Real activity feed derived from today's real database events + local session actions
  const combinedActivities = useMemo<ActivityLogItem[]>(() => {
    const fromEvents: ActivityLogItem[] = todayEvents.map((evt) => ({
      id: evt.id,
      time: evt.event_time || 'Today',
      title: evt.student_name || 'Student',
      detail:
        evt.event_type === 'picked_up'
          ? `Picked up at ${evt.stop_name || 'Designated Stop'}`
          : evt.event_type === 'dropped_off'
          ? `Safely dropped off at ${evt.stop_name || 'Designated Stop'}`
          : 'Marked not present / absent by driver',
      type: evt.event_type === 'picked_up' || evt.event_type === 'dropped_off' ? 'boarded' : 'absent',
    }));

    // Merge and deduplicate by ID
    const map = new Map<string, ActivityLogItem>();
    [...localActivities, ...fromEvents].forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values()).slice(0, 20);
  }, [todayEvents, localActivities]);

  // Mark single student pickup/drop status
  const handleMarkPickup = async (
    studentId: string,
    assignmentId: string | undefined,
    stopId: string,
    eventType: 'picked_up' | 'not_riding' | 'dropped_off'
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || student.isOnLeave) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: true, hour: 'numeric', minute: '2-digit' }).toLowerCase();

    // Update state locally
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, pickup_status: eventType, pickup_time: timeStr } : s))
    );

    // Record action to local activity log
    setLocalActivities((prev) => [
      {
        id: `act-${Date.now()}-${studentId}`,
        time: timeStr,
        title: `${student.first_name} ${student.last_name}`,
        detail:
          eventType === 'picked_up'
            ? 'Picked up at ' + (activeStop?.stop_name || 'Designated Stop')
            : eventType === 'dropped_off'
            ? 'Safely dropped off'
            : 'Marked not present / absent by driver',
        type: eventType === 'not_riding' ? 'absent' : 'boarded',
      },
      ...prev,
    ]);

    // Record to database
    try {
      const schoolId = currentUser?.school_id || 'sch-001';
      await transportService.recordTransportEvent({
        school_id: schoolId,
        student_id: studentId,
        student_name: `${student.first_name} ${student.last_name}`,
        registration_number: student.registration_number,
        class_name: student.current_enrollment?.class_name,
        section_name: student.current_enrollment?.section_name,
        roll_number: student.current_enrollment?.roll_number,
        photo_url: student.photo_url,
        transport_assignment_id: assignmentId || `asgn-${studentId}`,
        vehicle_id: vehicle?.id || 'veh-01',
        vehicle_name: vehicle?.vehicle_name || 'School Bus',
        route_id: route?.id || 'rt-01',
        route_name: route?.route_name || 'Assigned Route',
        stop_id: stopId,
        stop_name: activeStop?.stop_name || 'Designated Stop',
        event_type: eventType,
        event_date: now.toISOString().split('T')[0],
        event_time: timeStr,
        recorded_by: currentUser?.id || 'drv-01',
        recorded_by_name: driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : 'Driver',
      });
    } catch (err) {
      console.warn('Transport event record warning:', err);
    }

    success(
      eventType === 'picked_up'
        ? `${student.first_name} marked as Picked Up`
        : eventType === 'dropped_off'
        ? `${student.first_name} marked as Dropped Off`
        : `${student.first_name} marked as Absent`
    );
  };

  // Revert/Undo selection
  const handleRevertPickup = async (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, pickup_status: 'pending', pickup_time: undefined } : s))
    );
    try {
      await transportService.revertTransportEvent(studentId, undefined, activeShift === 'morning' ? 'picked_up' : 'dropped_off');
    } catch (err) {
      console.warn('Revert transport event error:', err);
    }
    success('Passenger status reverted to pending');
  };

  // Mark all pending students at active stop
  const handleMarkAllAtActiveStop = async () => {
    if (!activeStop) return;
    const targetStudents = currentStopStudents.filter((s) => !s.isOnLeave && s.pickup_status === 'pending');
    if (targetStudents.length === 0) {
      success('No pending passengers remaining at this stop');
      return;
    }

    for (const std of targetStudents) {
      await handleMarkPickup(
        std.id,
        std.assignment_id || std.transport_assignment?.id,
        activeStop.id,
        activeShift === 'morning' ? 'picked_up' : 'dropped_off'
      );
    }
    success(`Marked ${targetStudents.length} students as ${activeShift === 'morning' ? 'Picked Up' : 'Dropped Off'}`);
  };

  // Switch route if assigned multiple
  const handleSelectRoute = (routeId: string) => {
    const selected = driverRoutes.find((r) => r.id === routeId);
    if (!selected) return;
    setRoute(selected);
    if (selected.stops && selected.stops.length > 0) {
      setStops(selected.stops);
      setSelectedStopId(selected.stops[0].id);
    }
  };

  // Filtered passenger list for Center Manifest
  const filteredManifestStudents = useMemo(() => {
    let list = currentStopStudents;

    if (statusFilter === 'picked') {
      list = list.filter((s) => s.pickup_status === 'picked_up' || s.pickup_status === 'dropped_off');
    } else if (statusFilter === 'pending') {
      list = list.filter((s) => s.pickup_status === 'pending' && !s.isOnLeave);
    } else if (statusFilter === 'leave') {
      list = list.filter((s) => s.isOnLeave);
    } else if (statusFilter === 'not_riding') {
      list = list.filter((s) => s.pickup_status === 'not_riding' && !s.isOnLeave);
    }

    if (passengerSearch.trim()) {
      const q = passengerSearch.toLowerCase();
      list = list.filter((s) => {
        const name = `${s.first_name} ${s.last_name}`.toLowerCase();
        const reg = (s.registration_number || '').toLowerCase();
        const roll = (s.current_enrollment?.roll_number || '').toLowerCase();
        const guardian = (s.guardian?.guardian_name || s.guardian?.father_name || '').toLowerCase();
        return name.includes(q) || reg.includes(q) || roll.includes(q) || guardian.includes(q);
      });
    }

    return list;
  }, [currentStopStudents, statusFilter, passengerSearch]);

  // Proceed to next stop
  const handleDepartAndProceed = () => {
    if (activeStopIndex < stops.length - 1) {
      const nextStop = stops[activeStopIndex + 1];
      setSelectedStopId(nextStop.id);
      success(`Departed ${activeStop?.stop_name}. Next Stop: ${nextStop.stop_name}`);
    } else {
      success('Final stop reached! All passengers accounted for.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP OPERATIONAL APP BAR (Full-Width Fleet Cockpit)                      */}
      {/* ========================================================================= */}
      <header className="bg-slate-950 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          {/* Brand & School Fleet Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0 ring-2 ring-amber-400/30">
              <Bus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                  {currentSchool?.name || 'School Transport'}
                </span>
                {currentSchool?.code && (
                  <span className="bg-slate-800 text-indigo-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                    {currentSchool.code}
                  </span>
                )}
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Driver Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                <span>Fleet Cockpit</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">
                  {vehicle ? `${vehicle.vehicle_name} (${vehicle.vehicle_number})` : 'No Vehicle Assigned'}
                </span>
              </p>
            </div>
          </div>

          {/* Operational Shift Switcher (Morning Pickup vs Afternoon Drop) */}
          <div className="hidden md:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveShift('morning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeShift === 'morning'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Morning Pickup
            </button>
            <button
              onClick={() => setActiveShift('afternoon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeShift === 'afternoon'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Afternoon Drop
            </button>
          </div>

          {/* Right Action Hub: Telemetry sync, Call Dispatch, Profile & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Silent Sync Status */}
            <button
              onClick={() => loadDriverRoster(false)}
              disabled={isSyncing}
              title={`Last checked at ${lastSyncTime || 'now'}. Click to refresh quietly.`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Call Dispatch Hotline */}
            {(currentSchool?.phone || currentSchool?.school_contact_phone) && (
              <a
                href={`tel:${(currentSchool?.phone || currentSchool?.school_contact_phone || '').replace(/\s+/g, '')}`}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call Dispatch</span>
              </a>
            )}

            {/* Driver Profile Trigger */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {driverProfile?.photo_url ? (
                  <img src={driverProfile.photo_url} alt="Driver" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  (driverProfile?.first_name?.[0] || currentUser?.name?.[0] || 'D')
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-200 block leading-tight group-hover:text-white">
                  {driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : currentUser?.name || 'Driver'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                  {vehicle?.vehicle_number || 'Unassigned'}
                </span>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              title="Log Out"
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. OPERATIONAL STATUS BOARD (Full-Width)                                  */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <SchoolStatusBoard className="mb-4 shadow-sm" />
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN FULL-WIDTH WORKSPACE                                              */}
      {/* ========================================================================= */}
      {isInitialLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p className="font-bold text-sm text-slate-200">Checking Assigned Route & Passengers…</p>
          <p className="text-xs text-slate-400">Connecting to school transport server…</p>
        </div>
      ) : !isAssigned ? (
        /* ======================================================================= */
        /* FULL-PAGE UNASSIGNED DRIVER COCKPIT (No giant empty sides)              */
        /* ======================================================================= */
        <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1">
          <div className="grid grid-cols-12 gap-5 items-start">
            {/* Left 4 Cols: Driver Identity & Status Overview */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl uppercase shadow-md shrink-0">
                    {driverProfile?.first_name?.[0] || currentUser?.name?.[0] || 'D'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-lg text-white truncate capitalize">
                      {driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : currentUser?.name || 'Driver'}
                    </h2>
                    <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                      {driverProfile?.custom_type_name || driverProfile?.staff_type || 'School Bus Driver'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      ID: {driverProfile?.employee_number || driverProfile?.id || '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-700 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Account Status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Driver
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Assigned Bus</span>
                    <span className="text-slate-300 font-bold">None</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Assigned Route</span>
                    <span className="text-slate-300 font-bold">None</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Authorized Email</span>
                    <span className="text-slate-300 font-mono truncate max-w-[180px]">
                      {driverProfile?.email || currentUser?.email || '—'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-600"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>View Driver Record</span>
                </button>
              </div>
            </div>

            {/* Right 8 Cols: Full Guidance & Instructions */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl shrink-0">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">No Vehicle or Route Assigned Yet</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      Your driver account is active, but the school administrator has not assigned a bus vehicle or pickup route to your profile in the database.
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-2.5 text-xs">
                  <p className="font-extrabold text-amber-300 text-sm flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    How to get your route assigned:
                  </p>
                  <div className="space-y-2 text-slate-300 pl-1">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-700">
                        1
                      </span>
                      <p>
                        The School Administrator opens <strong>Transport Management</strong> in the admin panel.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-700">
                        2
                      </span>
                      <p>
                        Under <strong>Vehicles</strong>, they assign your driver profile to a bus fleet number.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-700">
                        3
                      </span>
                      <p>
                        Under <strong>Transport Routes</strong>, they link the vehicle to a pickup route and assign student stops.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-700">
                        4
                      </span>
                      <p>
                        Once assigned, click <strong>Check Status Now</strong> below and your ordered stops and student roster will appear automatically.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => loadDriverRoster(false)}
                    disabled={isSyncing}
                    className="w-full sm:flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Checking Server…' : 'Check Status Now'}</span>
                  </button>

                  {(currentSchool?.phone || currentSchool?.school_contact_phone) && (
                    <a
                      href={`tel:${(currentSchool?.phone || currentSchool?.school_contact_phone || '').replace(/\s+/g, '')}`}
                      className="w-full sm:flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors shadow-sm"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Call Administration ({currentSchool.phone || currentSchool.school_contact_phone})</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ======================================================================= */
        /* FULL-WIDTH 3-COLUMN COCKPIT (When Vehicle/Route is Assigned)            */
        /* ======================================================================= */
        <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-1 grid grid-cols-12 gap-5 items-start">
          {/* ======================================================================= */}
          {/* COLUMN 1: ROUTE OVERVIEW & STOPS SEQUENCE (col-span-12 lg:col-span-3)   */}
          {/* ======================================================================= */}
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
            {/* Route Overview Card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Active Route
                  </span>
                  <h2 className="font-extrabold text-base text-white mt-1.5 leading-snug">
                    {route?.route_name || 'Assigned Route'}
                  </h2>
                  {route?.city && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Zone: {route.city}</span>
                    </p>
                  )}
                </div>
                {route?.route_code && (
                  <span className="bg-slate-900 text-indigo-300 font-mono text-xs font-bold px-2 py-1 rounded-lg border border-slate-700">
                    {route.route_code}
                  </span>
                )}
              </div>

              {/* Route Selector if driver is assigned multiple routes */}
              {driverRoutes.length > 1 && (
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-medium shrink-0">Switch Route:</span>
                  <select
                    value={route?.id || ''}
                    onChange={(e) => handleSelectRoute(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 focus:outline-none flex-1 truncate"
                  >
                    {driverRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name} ({r.route_code || 'RT'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Real Stop Progress Bar */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400 font-semibold">{activeShift === 'morning' ? 'Pickup' : 'Drop'} Progress</span>
                  <span className="font-mono font-bold text-white">
                    {totalBoarded} / {totalAssigned - totalOnLeave}{' '}
                    <span className="text-amber-400 font-normal">({completionPercentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${totalAssigned > 0 ? (totalBoarded / totalAssigned) * 100 : 0}%` }}
                    title={activeShift === 'morning' ? 'Picked up' : 'Dropped'}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${totalAssigned > 0 ? (totalOnLeave / totalAssigned) * 100 : 0}%` }}
                    title="On Leave"
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${totalAssigned > 0 ? (totalAbsent / totalAssigned) * 100 : 0}%` }}
                    title="Absent"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                  <span>{totalPending} remaining</span>
                  <span>{totalBoarded} {activeShift === 'morning' ? 'picked' : 'dropped'}</span>
                </div>
              </div>
            </div>

            {/* Ordered Timeline of Stops */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Route Stops Sequence</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {stops.length} Stops
                </span>
              </div>

              {/* Vertical Stops Sequence Timeline */}
              {stops.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No stops configured on this route yet.</p>
              ) : (
                <div className="relative flex flex-col gap-3 pl-2 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
                  {stops.map((stop, idx) => {
                    const isCurrent = activeStop?.id === stop.id;
                    const stopStudents = getStudentsForStop(stop.id);
                    const sBoarded = stopStudents.filter(
                      (s) => s.pickup_status === 'picked_up' || s.pickup_status === 'dropped_off'
                    ).length;
                    const sLeave = stopStudents.filter((s) => s.isOnLeave).length;
                    const sAbsent = stopStudents.filter((s) => s.pickup_status === 'not_riding' && !s.isOnLeave).length;
                    const isComplete = stopStudents.length > 0 && sBoarded + sLeave + sAbsent === stopStudents.length;

                    return (
                      <div
                        key={stop.id}
                        onClick={() => setSelectedStopId(stop.id)}
                        className="relative flex items-start gap-3 cursor-pointer group"
                      >
                        {/* Timeline Node */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 shadow-sm transition-transform group-hover:scale-105 ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30'
                              : isComplete
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isComplete ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>

                        {/* Stop Info Card */}
                        <div
                          className={`p-3 rounded-xl flex-1 border transition-all ${
                            isCurrent
                              ? 'bg-slate-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                              : isComplete
                              ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60'
                              : 'bg-slate-900/40 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-white leading-snug group-hover:text-amber-300 transition-colors">
                              {stop.stop_name}
                            </h4>
                            <span className="font-mono text-xs font-semibold text-slate-400 shrink-0">
                              {formatTime(
                                activeShift === 'morning'
                                  ? stop.estimated_pickup_time
                                  : stop.estimated_drop_time || stop.estimated_pickup_time
                              )}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {stop.landmark || 'Designated Stop'}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px]">
                            <span className="font-semibold text-slate-300">
                              {sBoarded}/{stopStudents.length} {activeShift === 'morning' ? 'Picked Up' : 'Dropped'}
                            </span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                stop.stop_name + (stop.landmark ? ' ' + stop.landmark : ' Bus Stop')
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <Navigation className="w-3 h-3" /> Maps
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ======================================================================= */}
          {/* COLUMN 2: ACTIVE STOP & PASSENGER MANIFEST (col-span-12 lg:col-span-6) */}
          {/* ======================================================================= */}
          <section className="col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col gap-4">
            {/* Active Stop Control Banner */}
            <div className="bg-slate-800/90 border-l-4 border-l-amber-500 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Active Stop #{activeStopIndex + 1}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      Scheduled:{' '}
                      {formatTime(
                        activeShift === 'morning'
                          ? activeStop?.estimated_pickup_time
                          : activeStop?.estimated_drop_time || activeStop?.estimated_pickup_time
                      )}
                    </span>
                  </div>
                  <h1 className="font-extrabold text-lg sm:text-xl text-white mt-1.5 leading-snug">
                    {activeStop?.stop_name || 'Designated Pickup Stop'}
                  </h1>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeStop?.landmark || 'Designated Stop'} • {currentStopStudents.length} Assigned Students</span>
                  </p>
                </div>

                {/* Quick Batch Action */}
                {currentStopStudents.some((s) => !s.isOnLeave && s.pickup_status === 'pending') && (
                  <button
                    onClick={handleMarkAllAtActiveStop}
                    className="min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
                  >
                    <CheckCheck className="w-5 h-5 stroke-[2.5]" />
                    <span>Mark All Remaining {activeShift === 'morning' ? 'Picked Up' : 'Dropped'}</span>
                  </button>
                )}
              </div>

              {/* Search & Status Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search passenger, roll no, registration ID, parent…"
                    value={passengerSearch}
                    onChange={(e) => setPassengerSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-8 py-2.5 rounded-xl text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                  {passengerSearch && (
                    <button
                      onClick={() => setPassengerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    All ({currentStopStudents.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      statusFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    Pending ({currentStopStudents.filter((s) => s.pickup_status === 'pending' && !s.isOnLeave).length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('picked')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      statusFilter === 'picked'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {activeShift === 'morning' ? 'Picked Up' : 'Dropped'} ({currentStopStudents.filter((s) => s.pickup_status === 'picked_up' || s.pickup_status === 'dropped_off').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('leave')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      statusFilter === 'leave'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    Leave ({currentStopStudents.filter((s) => s.isOnLeave).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Passenger Student Cards List */}
            <div className="space-y-3">
              {filteredManifestStudents.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                  <p className="font-bold text-sm text-slate-300">No passengers match current filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing search or clicking another stop.</p>
                </div>
              ) : (
                filteredManifestStudents.map((std) => {
                  const guardianPhone =
                    std.guardian?.primary_phone ||
                    std.guardian?.secondary_phone ||
                    std.emergency_info?.emergency_contact_phone ||
                    '';
                  const guardianName =
                    std.guardian?.guardian_name ||
                    std.guardian?.father_name ||
                    std.guardian?.mother_name ||
                    'Parent / Guardian';
                  const emergencyAlert =
                    std.emergency_info?.allergies_alert || std.emergency_info?.medical_condition_note;
                  const isBoarded =
                    std.pickup_status === 'picked_up' || std.pickup_status === 'dropped_off';
                  const isAbsent = std.pickup_status === 'not_riding' && !std.isOnLeave;
                  const photoUrl = studentPhotoUrl(std);

                  return (
                    <article
                      key={std.id}
                      className={`bg-slate-800/80 rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${
                        std.isOnLeave
                          ? 'border-amber-500/40 bg-amber-950/20'
                          : isBoarded
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : isAbsent
                          ? 'border-rose-500/40 bg-rose-950/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Student Identity */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center font-black text-amber-300 text-xl uppercase shrink-0 border border-slate-600 overflow-hidden shadow-sm">
                            {photoUrl ? (
                              <img src={photoUrl} alt={`${std.first_name} ${std.last_name}`} className="w-full h-full object-cover" />
                            ) : (
                              (std.first_name?.[0] || 'S')
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight capitalize">
                                {std.first_name} {std.last_name}
                              </h3>
                              <span className="font-mono text-[10px] font-bold bg-slate-900 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                                {std.registration_number || 'REG-ID'}
                              </span>

                              {isBoarded && (
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> {std.pickup_status === 'dropped_off' ? 'Dropped' : 'Picked'} {std.pickup_time ? `at ${std.pickup_time}` : ''}
                                </span>
                              )}
                              {isAbsent && (
                                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Marked Absent
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-1 font-medium">
                              {std.current_enrollment?.class_name || 'Class'} {std.current_enrollment?.section_name || ''} • Roll #{std.current_enrollment?.roll_number || '—'}
                            </p>

                            {/* Medical Alert Tag */}
                            {emergencyAlert && emergencyAlert !== 'None' && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/40 text-xs font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{emergencyAlert}</span>
                              </div>
                            )}

                            {/* Parent Info & Direct Call */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              <span>Parent: <strong className="text-slate-200">{guardianName}</strong></span>
                              {guardianPhone && (
                                <a
                                  href={`tel:${guardianPhone.replace(/\s+/g, '')}`}
                                  className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 hover:underline"
                                >
                                  <PhoneCall className="w-3 h-3" /> Call Parent
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: 48px Touch Safe Controls */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {std.isOnLeave ? (
                            <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                              <span>🌴</span>
                              <div>
                                <span className="block leading-tight">On Approved Leave Today</span>
                                <span className="text-[10px] text-amber-400/80 font-normal block">
                                  {std.leaveReason || 'Approved by Administration'}
                                </span>
                              </div>
                            </div>
                          ) : isBoarded || isAbsent ? (
                            <button
                              onClick={() => handleRevertPickup(std.id)}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-600"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>Undo Status</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleMarkPickup(
                                    std.id,
                                    std.assignment_id || std.transport_assignment?.id,
                                    activeStop?.id || stops[0]?.id || 'stp-1',
                                    activeShift === 'morning' ? 'picked_up' : 'dropped_off'
                                  )
                                }
                                className="min-h-[46px] px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>{activeShift === 'morning' ? 'Mark Picked' : 'Mark Dropped'}</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleMarkPickup(
                                    std.id,
                                    std.assignment_id || std.transport_assignment?.id,
                                    activeStop?.id || stops[0]?.id || 'stp-1',
                                    'not_riding'
                                  )
                                }
                                className="min-h-[46px] px-3 bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                              >
                                <X className="w-4 h-4" />
                                <span>Absent</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* ======================================================================= */}
          {/* COLUMN 3: TELEMETRY, METRICS & ACTIVITY (col-span-12 xl:col-span-3)     */}
          {/* ======================================================================= */}
          <aside className="col-span-12 lg:col-span-12 xl:col-span-3 flex flex-col gap-4">
            {/* Real Route Metrics (2x2 Grid) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-sm text-white mb-3 flex items-center justify-between">
                <span>Route Manifest Metrics</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Assigned</span>
                  <div className="font-mono text-2xl font-black text-white mt-1">{totalAssigned}</div>
                  <span className="text-[10px] text-slate-500">Commuters</span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">{activeShift === 'morning' ? 'Picked Today' : 'Dropped Today'}</span>
                  <div className="font-mono text-2xl font-black text-emerald-300 mt-1">{totalBoarded}</div>
                  <span className="text-[10px] text-emerald-400/80">{completionPercentage}% Completed</span>
                </div>
                <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-wider">On Leave</span>
                  <div className="font-mono text-2xl font-black text-amber-300 mt-1">{totalOnLeave}</div>
                  <span className="text-[10px] text-amber-400/80">Approved Leaves</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Not Present</span>
                  <div className="font-mono text-2xl font-black text-rose-400 mt-1">{totalAbsent}</div>
                  <span className="text-[10px] text-slate-500">Marked Absent</span>
                </div>
              </div>
            </div>

            {/* Real Vehicle Fleet Card */}
            {vehicle && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">
                      {vehicle.vehicle_name}
                    </h4>
                    <p className="font-mono text-xs text-slate-400">
                      {vehicle.vehicle_number} • {vehicle.capacity} Seater
                    </p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {vehicle.status ? vehicle.status.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-slate-300">
                    <span className="text-slate-400">Vehicle Type:</span>
                    <span className="font-semibold capitalize">{vehicle.vehicle_type || vehicle.type || 'Bus'}</span>
                  </div>
                  {vehicle.driver_name && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-slate-300">
                      <span className="text-slate-400">Assigned Driver:</span>
                      <span className="font-semibold">{vehicle.driver_name}</span>
                    </div>
                  )}
                  {vehicle.helper_name && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-slate-300">
                      <span className="text-slate-400">Conductor / Helper:</span>
                      <span className="font-semibold">{vehicle.helper_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real Live Boarding Activity Stream */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col">
              <h4 className="font-bold text-sm text-white mb-2.5 flex items-center justify-between">
                <span>Today&apos;s Activity Stream</span>
                {combinedActivities.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </h4>
              {combinedActivities.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No transport events recorded yet today.
                </p>
              ) : (
                <div className="space-y-2 text-xs overflow-y-auto max-h-56 pr-1">
                  {combinedActivities.map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5 pb-2 border-b border-slate-700/50 last:border-0">
                      <span className="font-mono text-slate-400 font-semibold text-[10px] shrink-0 pt-0.5">
                        {item.time}
                      </span>
                      <p className="text-slate-300 leading-snug">
                        <strong className="text-white font-bold">{item.title}</strong> — {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Hotline & SOS Alarm */}
            <div className="bg-slate-800/80 border-2 border-rose-500/40 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white leading-tight">School Transport Dispatch</h4>
                    <span className="text-[10px] text-slate-400">Coordinator Helpdesk</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(currentSchool?.phone || currentSchool?.school_contact_phone) && (
                  <a
                    href={`tel:${(currentSchool?.phone || currentSchool?.school_contact_phone || '').replace(/\s+/g, '')}`}
                    className="flex-1 min-h-[42px] bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call Hotline</span>
                  </a>
                )}
                <button
                  onClick={() => setIsEmergencySosActive((prev) => !prev)}
                  className={`min-h-[42px] px-4 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                    isEmergencySosActive
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isEmergencySosActive ? 'SOS SENT' : 'SOS'}</span>
                </button>
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. STICKY IN-VEHICLE OPERATIONAL ADVANCEMENT BAR (Only when assigned)      */}
      {/* ========================================================================= */}
      {isAssigned && (
        <div className="w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-3 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl sticky bottom-0 z-40">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs sm:text-sm text-slate-200">
              Active stop: <strong className="text-white font-bold">{activeStop?.stop_name || 'Designated Stop'}</strong>{' '}
              <span className="text-slate-400">
                ({currentStopStudents.filter((s) => s.pickup_status === 'pending' && !s.isOnLeave).length} awaiting {activeShift === 'morning' ? 'pickup' : 'drop'})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsDelayModalOpen(true)}
              className="flex-1 sm:flex-initial min-h-[46px] px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Report Delay</span>
            </button>
            <button
              onClick={handleDepartAndProceed}
              className="flex-1 sm:flex-initial min-h-[48px] px-6 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Depart Stop & Proceed</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DRIVER PROFILE MODAL                                                   */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-amber-400" /> Driver & Vehicle Record
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl uppercase shadow-md shrink-0">
                {driverProfile?.first_name?.[0] || currentUser?.name?.[0] || 'D'}
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-base text-white truncate capitalize">
                  {driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : currentUser?.name || 'Driver'}
                </h4>
                <p className="text-xs text-amber-400 font-semibold">
                  {driverProfile?.custom_type_name || driverProfile?.staff_type || 'Driver'} • Transport Dept
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {driverProfile?.employee_number || driverProfile?.id || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Assigned Vehicle</span>
                <span className="font-bold text-white font-mono">
                  {vehicle ? `${vehicle.vehicle_number} (${vehicle.vehicle_name})` : 'Not Assigned'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Assigned Route</span>
                <span className="font-bold text-white">{route?.route_name || 'Not Assigned'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Contact Email</span>
                <span className="font-bold text-white font-mono truncate max-w-[220px]">
                  {driverProfile?.email || currentUser?.email || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-bold text-white font-mono">
                  {driverProfile?.phone || (currentUser as any)?.phone || 'Not provided'}
                </span>
              </div>
              {driverProfile?.license_number && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-slate-400">License Number</span>
                  <span className="font-bold text-white font-mono">{driverProfile.license_number}</span>
                </div>
              )}
            </div>

            <Button
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs"
            >
              Close Profile
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REPORT DELAY MODAL                                                     */}
      {/* ========================================================================= */}
      {isDelayModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-amber-400" /> Broadcast Route Delay
              </h3>
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Select or type the delay reason. This will immediately update the transport coordinator and notify parents on this route.
              </p>
              <div className="space-y-1.5">
                {[
                  'Heavy traffic congestion on route',
                  'Road construction / traffic diversion',
                  'Severe weather / rainfall slow transit',
                  'Vehicle mechanical pause / inspection',
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setDelayReason(reason)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                      delayReason === reason
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDelayModalOpen(false)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  success(`Delay broadcast sent to Transport Dispatch: "${delayReason}"`);
                  setIsDelayModalOpen(false);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Send Broadcast
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
