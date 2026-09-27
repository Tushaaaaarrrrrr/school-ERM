'use client';

// ============================================================================
// Driver Pickup Portal (Mobile-First, Stop-by-Stop Workflow & Driver Hub)
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { transportService, leaveService } from '@/lib/services/api';
import { Vehicle, TransportRoute, TransportStop, Student, StudentTransportEvent, Staff } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatTime, formatDate } from '@/lib/utils/formatters';
import {
  Bus,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Users,
  LogOut,
  Calendar,
  RefreshCw,
  AlertCircle,
  Check,
  RotateCcw,
  Phone,
  Navigation,
  Sun,
  Moon,
  ShieldCheck,
  HeartPulse,
  User,
  Award,
  Sparkles,
  Search,
  Filter,
  X,
  PhoneCall,
  CheckCheck,
  AlertTriangle,
  Mail,
  Building2,
} from 'lucide-react';
import { SchoolStatusBoard } from '@/components/school/school-status-board';

interface StudentPassenger extends Student {
  pickup_status: 'pending' | 'picked_up' | 'not_riding' | 'missed' | 'dropped_off';
  pickup_time?: string;
  assignment_id?: string;
  pickup_event_id?: string;
  isOnLeave?: boolean;
  leaveReason?: string;
}

export default function DriverPortalPage() {
  const { currentUser, currentSchool, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<Staff | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [driverRoutes, setDriverRoutes] = useState<TransportRoute[]>([]);
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [students, setStudents] = useState<StudentPassenger[]>([]);
  const [todayEvents, setTodayEvents] = useState<StudentTransportEvent[]>([]);

  // Navigation state: 'stops' (Stop-by-stop) | 'students' (All passengers) | 'route' (Timeline) | 'history' (Daily summary)
  const [activeTab, setActiveTab] = useState<'stops' | 'students' | 'route' | 'history'>('stops');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<'morning' | 'afternoon'>('morning');

  // Modals & UI States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [passengerSearch, setPassengerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'picked' | 'leave' | 'not_riding'>('all');

  const loadDriverRoster = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const schoolId = currentUser?.school_id || 'sch-001';

      const [data, evts, todayLeaves] = await Promise.all([
        transportService.getDriverRouteAndStudents(currentUser?.email || currentUser?.id, schoolId, currentUser || undefined),
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

      const allRoutes = (data as any).routes || (data.route ? [data.route] : []);
      setDriverProfile(data.driver);
      setVehicle(data.vehicle);
      setDriverRoutes(allRoutes);
      setRoute(data.route || allRoutes[0] || null);
      setStops(resolvedStops);
      setTodayEvents(evts);

      // Merge transport status & today's approved leave info onto students
      const mapped: StudentPassenger[] = (data.students || []).map((s) => {
        const matchingEvt = evts.find((e) => e.student_id === s.id && e.event_date === todayStr);
        const matchingLeave = todayLeaves.find((l) => l.student_id === s.id);
        const isStudentOnLeave = !!matchingLeave;

        return {
          ...s,
          pickup_status: (matchingEvt?.event_type as any) || (isStudentOnLeave ? 'not_riding' : 'pending'),
          pickup_time: matchingEvt?.event_time,
          assignment_id: s.transport_assignment?.id || (s as any).assignment?.id,
          pickup_event_id: matchingEvt?.id,
          isOnLeave: isStudentOnLeave,
          leaveReason: matchingLeave?.reason || 'Approved Medical / Personal Leave',
        };
      });

      setStudents(mapped);
    } catch (err) {
      console.error('Failed to load driver roster:', err);
      toastError('Failed to load assigned route schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDriverRoster();

    // Cross-tab and live database sync
    const handleSync = () => {
      loadDriverRoster();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('school_erp_data_sync', handleSync);

    // Periodic live sync polling (every 5 seconds)
    const interval = setInterval(() => {
      loadDriverRoster();
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('school_erp_data_sync', handleSync);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Mark single student pickup/drop status
  const handleMarkPickup = async (
    studentId: string,
    assignmentId: string | undefined,
    stopId: string,
    eventType: 'picked_up' | 'not_riding' | 'dropped_off'
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || student.isOnLeave) return;

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
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
        vehicle_name: vehicle?.vehicle_name || 'School Bus 07',
        route_id: route?.id || 'rt-01',
        route_name: route?.route_name || 'Route 4 - North Zone',
        stop_id: stopId,
        stop_name: stops.find((s) => s.id === stopId)?.stop_name || 'Designated Stop',
        event_type: eventType,
        event_date: now.toISOString().split('T')[0],
        event_time: timeStr,
        recorded_by: currentUser?.id || 'drv-01',
        recorded_by_name: driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : 'Driver',
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, pickup_status: eventType, pickup_time: timeStr } : s
        )
      );

      success(
        eventType === 'picked_up'
          ? `${student.first_name} marked as Picked Up`
          : eventType === 'dropped_off'
          ? `${student.first_name} marked as Dropped Off`
          : `${student.first_name} marked as Not Present`
      );
    } catch {
      toastError('Failed to record status');
    }
  };

  // Mark all pending students at a stop
  const handleMarkAllAtStop = async (stopId: string, eventType: 'picked_up' | 'dropped_off') => {
    const targetStudents = students.filter(
      (s) =>
        (s.transport_assignment?.stop_id === stopId || (s as any).stop?.id === stopId) &&
        !s.isOnLeave &&
        s.pickup_status === 'pending'
    );

    if (targetStudents.length === 0) return;

    for (const std of targetStudents) {
      await handleMarkPickup(std.id, std.assignment_id, stopId, eventType);
    }
    success(`Marked ${targetStudents.length} students as ${eventType === 'picked_up' ? 'Picked Up' : 'Dropped Off'}`);
  };

  // Revert/Undo selection
  const handleRevertPickup = async (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, pickup_status: 'pending', pickup_time: undefined } : s))
    );
    success('Passenger status reverted to pending');
  };

  // Handle switching active route when vehicle is assigned to multiple routes
  const handleSelectRoute = (routeId: string) => {
    const selected = driverRoutes.find((r) => r.id === routeId);
    if (!selected) return;
    setRoute(selected);
    if (selected.stops && selected.stops.length > 0) {
      setStops(selected.stops);
    }
    setSelectedStopId(null);
  };

  // Active Stop Selection
  const selectedStop = stops.find((st) => st.id === selectedStopId);
  const selectedStopIndex = stops.findIndex((st) => st.id === selectedStopId);

  const getStudentsForStop = (stopId: string) => {
    return students.filter(
      (s) => s.transport_assignment?.stop_id === stopId || (s as any).stop?.id === stopId
    );
  };

  const currentStopStudents = selectedStop ? getStudentsForStop(selectedStop.id) : [];

  // Summary counts
  const totalExpected = students.length;
  const totalOnLeave = students.filter((s) => s.isOnLeave).length;
  const totalPicked = students.filter((s) => s.pickup_status === 'picked_up' || s.pickup_status === 'dropped_off').length;
  const totalNotRiding = students.filter((s) => s.pickup_status === 'not_riding' && !s.isOnLeave).length;
  const totalPending = students.filter((s) => s.pickup_status === 'pending' && !s.isOnLeave).length;
  const completionPercentage = totalExpected > 0 ? Math.round(((totalPicked + totalOnLeave + totalNotRiding) / totalExpected) * 100) : 0;

  // Filtered students for 'All Passengers' tab
  const filteredAllStudents = useMemo(() => {
    let list = students;
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
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        const reg = (s.registration_number || '').toLowerCase();
        const roll = (s.current_enrollment?.roll_number || '').toLowerCase();
        const stopName = (s.transport_assignment?.stop_name || (s as any).stop?.stop_name || '').toLowerCase();
        const parentName = (s.guardian?.guardian_name || s.guardian?.father_name || '').toLowerCase();
        return fullName.includes(q) || reg.includes(q) || roll.includes(q) || stopName.includes(q) || parentName.includes(q);
      });
    }

    return list;
  }, [students, statusFilter, passengerSearch]);

  // Render a Single Student Card with Strict Leave Logic
  const renderStudentCard = (std: StudentPassenger, currentStop?: TransportStop) => {
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
    const emergencyAlert = std.emergency_info?.allergies_alert || std.emergency_info?.medical_condition_note;
    const stopAssigned = currentStop || (std as any).stop || stops.find((s) => s.id === std.transport_assignment?.stop_id) || stops[0];

    return (
      <div
        key={std.id}
        className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs ${
          std.isOnLeave
            ? 'border-amber-200 bg-amber-50/40'
            : std.pickup_status === 'picked_up' || std.pickup_status === 'dropped_off'
            ? 'border-emerald-200 bg-emerald-50/20'
            : std.pickup_status === 'not_riding'
            ? 'border-rose-200 bg-rose-50/20'
            : 'border-slate-200 hover:border-indigo-200'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Student Photo / Initial Badge */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 overflow-hidden border border-indigo-100 shrink-0 relative flex items-center justify-center shadow-2xs font-bold text-indigo-700 text-lg uppercase">
            {std.photo_url && !std.photo_url.includes('images.unsplash.com') ? (
              <img src={std.photo_url} alt={std.first_name} className="w-full h-full object-cover" />
            ) : (
              (std.first_name?.[0] || 'S')
            )}
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate capitalize">
                  {std.first_name} {std.last_name}
                </h4>
                <p className="text-xs font-medium text-slate-500">
                  {std.current_enrollment?.class_name || 'Class'} {std.current_enrollment?.section_name || ''} • Roll #{std.current_enrollment?.roll_number || '—'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] sm:text-xs shrink-0 border border-indigo-100 font-mono">
                {std.registration_number || 'REG'}
              </span>
            </div>

            {/* Stop info tag */}
            {stopAssigned?.stop_name && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate font-medium">{stopAssigned.stop_name}</span>
              </div>
            )}

            {/* Medical / Allergy alert */}
            {emergencyAlert && emergencyAlert !== 'None' && (
              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{emergencyAlert}</span>
              </div>
            )}

            {/* Parent contact & Call button */}
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block">{guardianName}</span>
                {guardianPhone ? (
                  <span className="text-[11px] text-slate-400 block font-mono">{guardianPhone}</span>
                ) : (
                  <span className="text-[11px] text-slate-400 block italic">No phone provided</span>
                )}
              </div>
              {guardianPhone && (
                <a
                  href={`tel:${guardianPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-xs transition-colors"
                  title={`Call ${guardianName}`}
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Parent
                </a>
              )}
            </div>

            {/* Attendance Actions: STRICT LEAVE-AWARE CONTROLS */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              {std.isOnLeave ? (
                /* IF ON LEAVE: SHOW LEAVE BADGE ONLY, DO NOT SHOW ACTION BUTTONS */
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <span className="text-xl leading-none">🌴</span>
                  <div>
                    <span className="font-bold text-amber-900 text-xs sm:text-sm block leading-tight">
                      On Leave Today (Approved)
                    </span>
                    <span className="text-xs text-amber-700 block font-medium mt-0.5">
                      {std.leaveReason || 'Leave approved by school administration'}
                    </span>
                  </div>
                </div>
              ) : std.pickup_status === 'picked_up' || std.pickup_status === 'dropped_off' ? (
                /* ALREADY PICKED UP / DROPPED OFF */
                <div className="flex items-center justify-between w-full bg-emerald-50/90 px-3 py-2.5 rounded-xl border border-emerald-200">
                  <span className="text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    {activeShift === 'morning' ? 'Boarded & Picked Up' : 'Safely Dropped Off'}
                    {std.pickup_time && <span className="text-xs font-mono text-emerald-600 font-normal">({std.pickup_time})</span>}
                  </span>
                  <button
                    onClick={() => handleRevertPickup(std.id)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300"
                  >
                    Undo
                  </button>
                </div>
              ) : std.pickup_status === 'not_riding' ? (
                /* MARKED NOT PRESENT / ABSENT */
                <div className="flex items-center justify-between w-full bg-rose-50/90 px-3 py-2.5 rounded-xl border border-rose-200">
                  <span className="text-xs sm:text-sm font-bold text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600 stroke-[2]" />
                    Marked Not Present / Absent
                  </span>
                  <button
                    onClick={() => handleRevertPickup(std.id)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300"
                  >
                    Undo
                  </button>
                </div>
              ) : (
                /* PENDING: SHOW BIG ACTION BUTTONS */
                <div className="grid grid-cols-2 gap-2.5 w-full">
                  <button
                    onClick={() =>
                      handleMarkPickup(
                        std.id,
                        std.assignment_id,
                        stopAssigned?.id || stops[0]?.id,
                        activeShift === 'morning' ? 'picked_up' : 'dropped_off'
                      )
                    }
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    {activeShift === 'morning' ? 'Mark Picked' : 'Mark Dropped'}
                  </button>
                  <button
                    onClick={() =>
                      handleMarkPickup(
                        std.id,
                        std.assignment_id,
                        stopAssigned?.id || stops[0]?.id,
                        'not_riding'
                      )
                    }
                    className="py-3 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Not Present
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-app-nav text-left font-sans select-none">
      {/* ========================================================================= */}
      {/* TOP BAR / HEADER */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            {/* Driver Avatar & Vehicle summary */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md relative overflow-hidden ring-2 ring-indigo-400/30 uppercase text-lg">
                {driverProfile?.photo_url && !driverProfile.photo_url.includes('images.unsplash.com') ? (
                  <img src={driverProfile.photo_url} alt="Driver" className="w-full h-full object-cover" />
                ) : (
                  (driverProfile?.first_name?.[0] || currentUser?.name?.[0] || 'D')
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-semibold mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentSchool?.name || 'School Transport'}{currentSchool?.code ? ` (${currentSchool.code})` : ''}</span>
                </div>
                <h1 className="font-bold text-sm sm:text-base tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">
                  {vehicle ? `${vehicle.vehicle_number} (${vehicle.vehicle_name})` : 'Driver Portal'}
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  {route ? `${route.route_name} • ` : ''}{driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : currentUser?.name || 'Assigned Driver'}
                </p>
              </div>
            </div>

            {/* Action buttons: Profile & Logout */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                title="Driver Profile"
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span className="inline">Profile</span>
              </button>
              <button
                onClick={() => logout()}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors border border-slate-700"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Shift Selector Switcher (Morning Pickup vs Afternoon Drop) */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => setActiveShift('morning')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeShift === 'morning'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-300" /> Morning Pickup
            </button>
            <button
              onClick={() => setActiveShift('afternoon')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeShift === 'afternoon'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-200" /> Afternoon Drop
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
        {/* Live School Operational Status Board */}
        <SchoolStatusBoard />

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="font-semibold text-slate-600">Loading assigned route, stops & passengers…</span>
          </div>
        ) : (!vehicle && !route && students.length === 0) ? (
          /* NO VEHICLE OR ROUTE ASSIGNED STATE */
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs text-center space-y-4 my-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
              <Bus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Vehicle or Route Assigned Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your driver account is active, but the school administrator has not assigned a bus or pickup route to your profile yet.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 text-left space-y-1.5">
              <p className="font-semibold text-slate-800">How to get your route:</p>
              <p className="text-[11px]">1. The School Administrator assigns your bus vehicle and route under <strong>Transport Management</strong>.</p>
              <p className="text-[11px]">2. Once assigned, your vehicle number, 5 stops, and student passenger pickup roster will appear here automatically.</p>
            </div>
            {currentSchool?.phone && (
              <a
                href={`tel:${currentSchool.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors"
              >
                <Phone className="w-4 h-4" /> Call School Administration ({currentSchool.phone})
              </a>
            )}
          </div>
        ) : (
          <>
            {/* VEHICLE & ROUTE SPEC CARD */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {vehicle?.vehicle_name || route?.route_name || 'School Bus Fleet'}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500">
                      {vehicle?.vehicle_number || 'Fleet Vehicle'} • {vehicle?.capacity || 40} Seater
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {route?.route_code || 'RT'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{stops.length} Ordered Stops</p>
                </div>
              </div>

              {/* Route & City Selector if vehicle is assigned to multiple routes */}
              {driverRoutes.length > 1 ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Active Route:</span>
                  </div>
                  <select
                    value={route?.id || ''}
                    onChange={(e) => handleSelectRoute(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs font-bold text-indigo-900 focus:bg-white focus:outline-none flex-1 max-w-xs truncate"
                  >
                    {driverRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        📍 {r.city ? `${r.city} • ` : ''}{r.route_name} ({r.route_code || 'RT'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : route?.city ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Transport Zone / City:
                  </span>
                  <span className="font-bold text-indigo-700">📍 {route.city}</span>
                </div>
              ) : null}

              {/* Real-time Seating / Boarding Progress */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Shift Boarding Progress</span>
                  <span className="font-mono text-indigo-600">
                    {totalPicked} / {totalExpected - totalOnLeave} Boarded ({completionPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${totalExpected > 0 ? (totalPicked / totalExpected) * 100 : 0}%` }}
                    title="Boarded"
                  ></div>
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${totalExpected > 0 ? (totalOnLeave / totalExpected) * 100 : 0}%` }}
                    title="On Leave"
                  ></div>
                  <div
                    className="bg-rose-400 h-full transition-all duration-300"
                    style={{ width: `${totalExpected > 0 ? (totalNotRiding / totalExpected) * 100 : 0}%` }}
                    title="Not Present"
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {totalPicked} Boarded</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> {totalOnLeave} On Leave</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> {totalNotRiding} Absent</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200"></span> {totalPending} Pending</span>
                </div>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'stops' ? (
          /* ========================================================================= */
          /* TAB 1: STOPS (STOP-BY-STOP WORKFLOW) */
          /* ========================================================================= */
          selectedStop ? (
            /* ACTIVE STOP DETAIL VIEW */
            <div className="space-y-4">
              {/* Active Stop Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedStopId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" /> All Stops ({stops.length})
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedStop.stop_name + (selectedStop.landmark ? ' ' + selectedStop.landmark : ' Bus Stop')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-100"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Map Directions
                  </a>
                </div>

                <div className="flex items-start justify-between pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {selectedStop.stop_order}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 leading-tight">
                        {selectedStop.stop_name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {selectedStop.landmark || 'Designated Pickup / Drop Point'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {formatTime(
                        activeShift === 'morning'
                          ? selectedStop.estimated_pickup_time
                          : selectedStop.estimated_drop_time || selectedStop.estimated_pickup_time
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                      {activeShift === 'morning' ? 'Pickup Time' : 'Drop Time'}
                    </span>
                  </div>
                </div>

                {/* Stop Navigation Controls (Prev / Next Stop) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold">
                  <button
                    disabled={selectedStopIndex <= 0}
                    onClick={() => setSelectedStopId(stops[selectedStopIndex - 1]?.id || null)}
                    className="inline-flex items-center gap-1 text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:text-indigo-600"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Stop
                  </button>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Stop {selectedStopIndex + 1} of {stops.length}
                  </span>
                  <button
                    disabled={selectedStopIndex >= stops.length - 1}
                    onClick={() => setSelectedStopId(stops[selectedStopIndex + 1]?.id || null)}
                    className="inline-flex items-center gap-1 text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:text-indigo-600"
                  >
                    Next Stop <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stop Passengers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Passengers at Stop #{selectedStop.stop_order} ({currentStopStudents.length})
                  </span>
                  {currentStopStudents.some((s) => !s.isOnLeave && s.pickup_status === 'pending') && (
                    <button
                      onClick={() =>
                        handleMarkAllAtStop(
                          selectedStop.id,
                          activeShift === 'morning' ? 'picked_up' : 'dropped_off'
                        )
                      }
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                    >
                      Mark All Remaining
                    </button>
                  )}
                </div>

                {currentStopStudents.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700">No passengers assigned to this stop.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Check All Passengers tab to see complete roster.</p>
                  </div>
                ) : (
                  currentStopStudents.map((std) => renderStudentCard(std, selectedStop))
                )}
              </div>
            </div>
          ) : (
            /* ALL STOPS SELECTOR LIST */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Route Stops Progression
                </span>
                <span className="text-xs font-semibold text-slate-400">{stops.length} Stops</span>
              </div>

              {stops.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xs text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {vehicle ? `Vehicle ${vehicle.vehicle_name} Assigned` : 'No Stops Assigned Yet'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      {vehicle
                        ? `Your vehicle (${vehicle.vehicle_number}) is linked to your driver profile. Once the school administration assigns a pickup route, your stops will appear here.`
                        : 'No pickup stops have been assigned to your profile.'}
                    </p>
                  </div>
                </div>
              ) : (
                stops.map((stop, idx) => {
                const sStudents = getStudentsForStop(stop.id);
                const sPicked = sStudents.filter((s) => s.pickup_status === 'picked_up' || s.pickup_status === 'dropped_off').length;
                const sLeave = sStudents.filter((s) => s.isOnLeave).length;
                const sNotRiding = sStudents.filter((s) => s.pickup_status === 'not_riding' && !s.isOnLeave).length;
                const isComplete = sStudents.length > 0 && sPicked + sLeave + sNotRiding === sStudents.length;

                return (
                  <div
                    key={stop.id}
                    onClick={() => setSelectedStopId(stop.id)}
                    className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:border-indigo-300 shadow-2xs ${
                      isComplete ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {isComplete ? <Check className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 leading-snug">{stop.stop_name}</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {stop.landmark || 'Designated Stop'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {sStudents.length} {sStudents.length === 1 ? 'passenger' : 'passengers'}
                            </span>
                            {sLeave > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                🌴 {sLeave} on leave
                              </span>
                            )}
                            {sPicked > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                ✓ {sPicked} boarded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end justify-between h-full">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {formatTime(
                            activeShift === 'morning'
                              ? stop.estimated_pickup_time
                              : stop.estimated_drop_time || stop.estimated_pickup_time
                          )}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 mt-4" />
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          )
        ) : activeTab === 'students' ? (
          /* ========================================================================= */
          /* TAB 2: ALL PASSENGERS (UNIFIED ROSTER WITH SEARCH & STATUS FILTERS) */
          /* ========================================================================= */
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search student, roll, parent, stop…"
                value={passengerSearch}
                onChange={(e) => setPassengerSearch(e.target.value)}
                className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
              {passengerSearch && (
                <button onClick={() => setPassengerSearch('')} className="absolute right-3 top-3 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                All ({students.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Pending ({totalPending})
              </button>
              <button
                onClick={() => setStatusFilter('picked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  statusFilter === 'picked'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Boarded ({totalPicked})
              </button>
              <button
                onClick={() => setStatusFilter('leave')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  statusFilter === 'leave'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                🌴 On Leave ({totalOnLeave})
              </button>
              <button
                onClick={() => setStatusFilter('not_riding')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  statusFilter === 'not_riding'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Not Present ({totalNotRiding})
              </button>
            </div>

            {/* Filtered Students List */}
            <div className="space-y-3">
              {filteredAllStudents.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  <p className="font-semibold text-slate-700">No passengers match current filter.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try clearing search or changing the filter chip above.</p>
                </div>
              ) : (
                filteredAllStudents.map((std) => renderStudentCard(std))
              )}
            </div>
          </div>
        ) : activeTab === 'route' ? (
          /* ========================================================================= */
          /* TAB 3: ROUTE TIMELINE & MAP VIEW */
          /* ========================================================================= */
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-base text-slate-900">{route?.route_name || 'Route 4 - North Zone'}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{route?.description || 'Rohini, Pitampura, Shalimar Bagh to School'}</p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  {route?.route_code || 'RT-04'}
                </span>
              </div>

              {/* Vertical Route Progression Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
                {stops.map((stop, idx) => {
                  const sCount = getStudentsForStop(stop.id).length;
                  return (
                    <div key={stop.id} className="relative">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center ring-4 ring-white shadow-xs">
                        {idx + 1}
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-slate-900">{stop.stop_name}</h4>
                          <span className="font-mono text-[11px] font-bold text-indigo-600 shrink-0">
                            {formatTime(activeShift === 'morning' ? stop.estimated_pickup_time : stop.estimated_drop_time || stop.estimated_pickup_time)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{stop.landmark || 'Designated Stop'}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">{sCount} {sCount === 1 ? 'student' : 'students'} assigned</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              stop.stop_name + (stop.landmark ? ' ' + stop.landmark : ' Bus Stop')
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" /> Navigate
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* TAB 4: HISTORY & DAILY SUMMARY */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Daily Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block">Total Assigned</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalExpected}</span>
                <span className="text-[10px] text-slate-400 font-medium">Registered Commuters</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 block">Boarded Today</span>
                <span className="text-2xl font-bold text-emerald-800 mt-1 block">{totalPicked}</span>
                <span className="text-[10px] text-emerald-600 font-medium">{activeShift === 'morning' ? 'Picked Up' : 'Dropped Off'}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-800 block">On Leave</span>
                <span className="text-2xl font-bold text-amber-900 mt-1 block">{totalOnLeave}</span>
                <span className="text-[10px] text-amber-700 font-medium">Approved Leaves</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                <span className="text-[11px] font-bold text-rose-700 block">Not Present</span>
                <span className="text-2xl font-bold text-rose-800 mt-1 block">{totalNotRiding}</span>
                <span className="text-[10px] text-rose-600 font-medium">Absent / Direct Drop</span>
              </div>
            </div>

            {/* Today's Activity Log */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Today&apos;s Boarding Log</h3>
              {todayEvents.length === 0 && students.filter((s) => s.pickup_time).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No boarding events logged yet today.</p>
              ) : (
                <div className="space-y-2">
                  {students
                    .filter((s) => s.pickup_time)
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-800">{s.first_name} {s.last_name}</span>
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">{s.pickup_time}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        </>
      )}
      </main>

      {/* ========================================================================= */}
      {/* DRIVER PROFILE MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-4 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" /> Driver & Vehicle Profile
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Driver Identity Card */}
            <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md overflow-hidden text-xl uppercase">
                {driverProfile?.photo_url ? (
                  <img src={driverProfile.photo_url} alt="Driver" className="w-full h-full object-cover" />
                ) : (
                  (driverProfile?.first_name?.[0] || currentUser?.name?.[0] || 'D')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base text-slate-900 capitalize">
                  {driverProfile?.first_name ? `${driverProfile.first_name} ${driverProfile.last_name}` : currentUser?.name || 'Assigned Driver'}
                </h4>
                <p className="text-xs font-semibold text-indigo-700 capitalize">
                  {driverProfile?.custom_type_name || driverProfile?.staff_type || currentUser?.role || 'Driver'}
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  ID: {driverProfile?.employee_number || driverProfile?.id || '—'}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Authorized Email</span>
                <span className="font-bold font-mono text-slate-900 truncate max-w-[220px]">
                  {driverProfile?.email || currentUser?.email || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Contact Phone</span>
                <span className="font-bold font-mono text-slate-900">{driverProfile?.phone || (currentUser as any)?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Driving License</span>
                <span className="font-bold font-mono text-slate-900">{driverProfile?.license_number || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Vehicle</span>
                <span className="font-bold text-slate-900">
                  {vehicle ? `${vehicle.vehicle_number} (${vehicle.vehicle_name})` : 'Not Assigned by School Admin'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Route</span>
                <span className="font-bold text-slate-900">
                  {route ? `${route.route_name} (${stops.length} Stops)` : 'No Route Assigned Yet'}
                </span>
              </div>
            </div>

            {/* School Administration Transport Helpline */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold text-amber-900 block truncate">
                  {currentSchool?.name || 'School Office'} Transport Helpdesk
                </span>
                <span className="text-[11px] text-amber-700 font-mono">
                  {currentSchool?.phone || currentSchool?.school_contact_phone || 'Contact Administration'}
                </span>
              </div>
              {(currentSchool?.phone || currentSchool?.school_contact_phone) && (
                <a
                  href={`tel:${(currentSchool?.phone || currentSchool?.school_contact_phone || '').replace(/\s+/g, '')}`}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs shrink-0"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Dispatch
                </a>
              )}
            </div>

            {/* Close Button */}
            <Button
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-bold text-xs"
            >
              Close Profile
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FIXED BOTTOM NAVIGATION BAR */}
      {/* ========================================================================= */}
      {(vehicle || route || students.length > 0) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 shadow-lg pb-safe-bottom">
          <div className="max-w-2xl mx-auto px-4 py-2">
            <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-bold">
              <button
                onClick={() => {
                  setSelectedStopId(null);
                  setActiveTab('stops');
                }}
                className={`py-1.5 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'stops' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span>Stops</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStopId(null);
                  setActiveTab('students');
                }}
                className={`py-1.5 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'students' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Passengers</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStopId(null);
                  setActiveTab('route');
                }}
                className={`py-1.5 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'route' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Bus className="w-5 h-5" />
                <span>Route</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStopId(null);
                  setActiveTab('history');
                }}
                className={`py-1.5 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === 'history' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Summary</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
