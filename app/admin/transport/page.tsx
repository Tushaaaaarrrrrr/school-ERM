'use client';

// ============================================================================
// School Admin Transport Dashboard (Fleets, Cities, Routes, Stops & Realtime Pickups)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { transportService, studentService, staffService } from '@/lib/services/api';
import {
  Vehicle,
  TransportRoute,
  TransportStop,
  StudentTransportAssignment,
  StudentTransportEvent,
  Student,
  Staff,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { confirmDeleteTwice } from '@/lib/utils/delete-confirm';
import {
  Bus,
  Plus,
  MapPin,
  Clock,
  Users,
  Edit3,
  Trash2,
  Search,
  Check,
  RotateCcw,
  Building2,
  Layers,
  Phone,
  AlertCircle,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { FeatureGuard } from '@/components/layout/feature-guard';

export default function AdminTransportPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'routes' | 'students'>('overview');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [todayEvents, setTodayEvents] = useState<StudentTransportEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Staff[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    vehiclesActive: 0,
    routesRunning: 0,
    totalStudents: 0,
    todayPickedUp: 0,
    todayNotRiding: 0,
    todayPending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [overviewSearch, setOverviewSearch] = useState('');
  const [overviewRouteFilter, setOverviewRouteFilter] = useState('all');
  const [overviewStatusFilter, setOverviewStatusFilter] = useState<'all' | 'picked_up' | 'pending' | 'not_riding'>('all');

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchTable, setStudentSearchTable] = useState('');
  const [tableRouteFilter, setTableRouteFilter] = useState('all');
  const [cityFilterTab, setCityFilterTab] = useState<string>('all');

  // Modals for Creation
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState(false);

  // Modals for Editing
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<StudentTransportAssignment | null>(null);

  // Vehicle Create Form State
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleName: 'School Bus',
    type: 'bus' as Vehicle['type'],
    capacity: 40,
    driverId: '',
    status: 'active' as Vehicle['status'],
  });

  // Vehicle Edit Form State
  const [editVehicleForm, setEditVehicleForm] = useState({
    vehicleNumber: '',
    vehicleName: '',
    type: 'bus' as Vehicle['type'],
    capacity: 40,
    driverId: '',
    status: 'active' as Vehicle['status'],
  });

  // Route Create Form State
  const [routeForm, setRouteForm] = useState({
    cityMode: 'existing' as 'existing' | 'new',
    selectedCity: '',
    newCity: '',
    routeName: '',
    routeCode: '',
    assignedVehicleId: '',
    stops: [
      { stop_name: '', estimated_pickup_time: '07:20 AM', estimated_drop_time: '02:30 PM', stop_order: 1 },
    ],
  });

  // Route Edit Form State
  const [editRouteForm, setEditRouteForm] = useState<{
    cityMode: 'existing' | 'new';
    selectedCity: string;
    newCity: string;
    routeName: string;
    routeCode: string;
    assignedVehicleId: string;
    status: 'active' | 'inactive';
    stops: { id?: string; stop_name: string; city?: string; estimated_pickup_time: string; estimated_drop_time: string; stop_order: number }[];
  }>({
    cityMode: 'existing',
    selectedCity: '',
    newCity: '',
    routeName: '',
    routeCode: '',
    assignedVehicleId: '',
    status: 'active',
    stops: [],
  });

  // Assign Student Form State
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    city: '',
    stopId: '',
    vehicleId: '',
    routeId: '',
    pickupEnabled: true,
  });

  // Edit Assignment Form State
  const [editAssignForm, setEditAssignForm] = useState({
    city: '',
    vehicleId: '',
    routeId: '',
    stopId: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Extract distinct configured Cities from Routes & Stops
  const availableCities = React.useMemo(() => {
    const citySet = new Set<string>();
    routes.forEach((r) => {
      if (r.city?.trim()) citySet.add(r.city.trim());
      (r.stops || []).forEach((st) => {
        if (st.city?.trim()) citySet.add(st.city.trim());
      });
    });
    return Array.from(citySet);
  }, [routes]);

  // Group routes by city
  const routesByCity = React.useMemo(() => {
    const map: { [city: string]: TransportRoute[] } = {};
    availableCities.forEach((c) => {
      map[c] = [];
    });
    routes.forEach((r) => {
      const c = r.city?.trim() || availableCities[0] || 'General';
      if (!map[c]) map[c] = [];
      map[c].push(r);
    });
    return map;
  }, [routes, availableCities]);

  // Helper: Find which vehicle a driver is currently assigned to
  const getAssignedVehicleForDriver = (driverId: string, excludeVehicleId?: string) => {
    if (!driverId) return null;
    return vehicles.find((v) => v.driver_id === driverId && v.id !== excludeVehicleId) || null;
  };

  // Existing routes in currently selected city for modal
  const existingRoutesInSelectedCity = React.useMemo(() => {
    const targetCity = routeForm.cityMode === 'existing' ? routeForm.selectedCity : routeForm.newCity.trim();
    if (!targetCity) return [];
    return routes.filter((r) => (r.city || '').toLowerCase() === targetCity.toLowerCase());
  }, [routes, routeForm.cityMode, routeForm.selectedCity, routeForm.newCity]);

  // Routes in selected city for Assign Student Modal
  const routesInSelectedCity = React.useMemo(() => {
    if (!assignForm.city) return routes;
    return routes.filter((r) => (r.city || '').toLowerCase() === assignForm.city.toLowerCase());
  }, [routes, assignForm.city]);

  // Stops available for the selected Route in Assign Modal
  const stopsInSelectedRoute = React.useMemo(() => {
    if (!assignForm.routeId) {
      if (routesInSelectedCity.length > 0) {
        return routesInSelectedCity[0].stops || [];
      }
      return [];
    }
    const foundRoute = routes.find((r) => r.id === assignForm.routeId);
    return foundRoute?.stops || [];
  }, [routes, assignForm.routeId, routesInSelectedCity]);

  // Routes in edit city
  const routesInEditCity = React.useMemo(() => {
    if (!editAssignForm.city) return routes;
    return routes.filter((r) => (r.city || '').toLowerCase() === editAssignForm.city.toLowerCase());
  }, [routes, editAssignForm.city]);

  // Stops in edit route
  const stopsInEditRoute = React.useMemo(() => {
    if (!editAssignForm.routeId) {
      if (routesInEditCity.length > 0) {
        return routesInEditCity[0].stops || [];
      }
      return [];
    }
    const foundRoute = routes.find((r) => r.id === editAssignForm.routeId);
    return foundRoute?.stops || [];
  }, [routes, editAssignForm.routeId, routesInEditCity]);

  // Filtered Students for Modal Selector
  const filteredModalStudents = React.useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const reg = (s.registration_number || '').toLowerCase();
      const cls = (s.current_enrollment?.class_name || '').toLowerCase();
      const roll = (s.current_enrollment?.roll_number || '').toString().toLowerCase();
      return name.includes(q) || reg.includes(q) || cls.includes(q) || roll.includes(q);
    });
  }, [students, studentSearchQuery]);

  // Selected Student Object in Modal
  const selectedStudent = React.useMemo(() => {
    return students.find((s) => s.id === assignForm.studentId) || null;
  }, [students, assignForm.studentId]);

  // Filtered Commuters for Live Status (Tab 1)
  const filteredLiveAssignments = React.useMemo(() => {
    return assignments.filter((asg) => {
      const student = students.find((s) => s.id === asg.student_id);
      const todayEvt = todayEvents.find((e) => e.student_id === asg.student_id);
      const currentStatus = todayEvt ? todayEvt.event_type : 'pending';

      if (overviewStatusFilter !== 'all' && currentStatus !== overviewStatusFilter) {
        return false;
      }
      if (overviewRouteFilter !== 'all' && asg.route_id !== overviewRouteFilter) {
        return false;
      }
      if (overviewSearch.trim()) {
        const q = overviewSearch.toLowerCase();
        const sName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
        const reg = (student?.registration_number || '').toLowerCase();
        const stop = (asg.stop_name || '').toLowerCase();
        const veh = (asg.vehicle_name || '').toLowerCase();
        const city = (asg.city || '').toLowerCase();
        if (!sName.includes(q) && !reg.includes(q) && !stop.includes(q) && !veh.includes(q) && !city.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, students, todayEvents, overviewSearch, overviewRouteFilter, overviewStatusFilter]);

  // Filtered Assigned Commuters for Main Table (Tab 4)
  const filteredAssignments = React.useMemo(() => {
    return assignments.filter((asg) => {
      if (tableRouteFilter !== 'all' && asg.route_id !== tableRouteFilter) {
        return false;
      }
      if (studentSearchTable.trim()) {
        const q = studentSearchTable.toLowerCase();
        const student = students.find((s) => s.id === asg.student_id);
        const name = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
        const reg = (student?.registration_number || '').toLowerCase();
        const city = (asg.city || '').toLowerCase();
        const veh = (asg.vehicle_name || '').toLowerCase();
        const route = (asg.route_name || '').toLowerCase();
        const stop = (asg.stop_name || '').toLowerCase();
        return name.includes(q) || reg.includes(q) || city.includes(q) || veh.includes(q) || route.includes(q) || stop.includes(q);
      }
      return true;
    });
  }, [assignments, students, studentSearchTable, tableRouteFilter]);

  const loadTransportData = async () => {
    setIsLoading(true);
    try {
      const [vList, rList, aList, evts, sList, dList, stats] = await Promise.all([
        transportService.getVehicles(schoolId),
        transportService.getRoutes(schoolId),
        transportService.getStudentAssignments(schoolId),
        transportService.getTodayTransportEvents(schoolId),
        studentService.getStudents(schoolId),
        staffService.getStaff(schoolId, { staffType: 'driver' }),
        transportService.getTransportDashboardStats(schoolId),
      ]);

      setVehicles(vList);
      setRoutes(rList);
      setAssignments(aList);
      setTodayEvents(evts);
      setStudents(sList);
      setDrivers(dList);
      setDashboardStats(stats);
    } catch {
      toastError('Failed to load transport module');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransportData();
  }, [schoolId]);

  // --------------------------------------------------------------------------
  // VEHICLE CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce 1 driver max per 1 vehicle
    if (vehicleForm.driverId) {
      const busy = getAssignedVehicleForDriver(vehicleForm.driverId);
      if (busy) {
        toastError(`This driver is already assigned to "${busy.vehicle_name}" (${busy.vehicle_number}). A driver can only be assigned to one vehicle at a time.`);
        return;
      }
    }

    try {
      const d = drivers.find((drv) => drv.id === vehicleForm.driverId);
      await transportService.createVehicle({
        school_id: schoolId,
        vehicle_number: vehicleForm.vehicleNumber.trim(),
        vehicle_name: vehicleForm.vehicleName.trim(),
        type: vehicleForm.type,
        capacity: vehicleForm.capacity,
        driver_id: vehicleForm.driverId || undefined,
        driver_name: d ? `${d.first_name} ${d.last_name}` : undefined,
        driver_phone: d?.phone,
        status: vehicleForm.status,
      });

      success('Vehicle added to school fleet');
      setIsVehicleModalOpen(false);
      setVehicleForm({
        vehicleNumber: '',
        vehicleName: 'School Bus',
        type: 'bus',
        capacity: 40,
        driverId: '',
        status: 'active',
      });
      loadTransportData();
    } catch {
      toastError('Failed to add vehicle');
    }
  };

  const openEditVehicleModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setEditVehicleForm({
      vehicleNumber: v.vehicle_number,
      vehicleName: v.vehicle_name,
      type: v.type || 'bus',
      capacity: v.capacity || 40,
      driverId: v.driver_id || '',
      status: v.status || 'active',
    });
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    // Enforce 1 driver max per 1 vehicle
    if (editVehicleForm.driverId) {
      const busy = getAssignedVehicleForDriver(editVehicleForm.driverId, editingVehicle.id);
      if (busy) {
        toastError(`This driver is already assigned to "${busy.vehicle_name}" (${busy.vehicle_number}). A driver can only be assigned to one vehicle at a time.`);
        return;
      }
    }

    try {
      const d = drivers.find((drv) => drv.id === editVehicleForm.driverId);
      await transportService.updateVehicle(editingVehicle.id, {
        school_id: schoolId,
        vehicle_number: editVehicleForm.vehicleNumber.trim(),
        vehicle_name: editVehicleForm.vehicleName.trim(),
        type: editVehicleForm.type,
        capacity: editVehicleForm.capacity,
        driver_id: editVehicleForm.driverId || undefined,
        driver_name: d ? `${d.first_name} ${d.last_name}` : undefined,
        driver_phone: d?.phone,
        status: editVehicleForm.status,
      });

      success('Vehicle updated successfully');
      setEditingVehicle(null);
      loadTransportData();
    } catch {
      toastError('Failed to update vehicle');
    }
  };

  const handleDeleteVehicle = async (v: Vehicle) => {
    if (!confirmDeleteTwice(`${v.vehicle_name} (${v.vehicle_number})`)) return;
    try {
      await transportService.deleteVehicle(v.id);
      success('Vehicle removed from fleet');
      loadTransportData();
    } catch {
      toastError('Failed to delete vehicle');
    }
  };

  // --------------------------------------------------------------------------
  // ROUTE & CITY CRUD HANDLERS
  // --------------------------------------------------------------------------
  const openCreateRouteModalForCity = (city?: string) => {
    const initialCity = city || availableCities[0] || '';
    setRouteForm({
      cityMode: initialCity ? 'existing' : 'new',
      selectedCity: initialCity,
      newCity: '',
      routeName: '',
      routeCode: '',
      assignedVehicleId: '',
      stops: [
        { stop_name: '', estimated_pickup_time: '07:20 AM', estimated_drop_time: '02:30 PM', stop_order: 1 },
      ],
    });
    setIsRouteModalOpen(true);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCity =
      routeForm.cityMode === 'existing'
        ? routeForm.selectedCity.trim()
        : routeForm.newCity.trim();

    if (!effectiveCity) {
      toastError('Please choose or enter a City / Area name');
      return;
    }
    if (!routeForm.routeName.trim()) {
      toastError('Please enter a Route name');
      return;
    }

    try {
      const validStops = routeForm.stops
        .filter((st) => st.stop_name.trim())
        .map((st, idx) => ({
          ...st,
          stop_name: st.stop_name.trim(),
          stop_order: idx + 1,
          city: effectiveCity,
        }));

      await transportService.createRoute(
        {
          school_id: schoolId,
          city: effectiveCity,
          route_name: routeForm.routeName.trim(),
          route_code: routeForm.routeCode.trim() || `RT-${Date.now().toString().slice(-3)}`,
          assigned_vehicle_id: routeForm.assignedVehicleId || undefined,
          status: 'active',
        },
        validStops
      );

      success(`Route "${routeForm.routeName}" added to ${effectiveCity}`);
      setIsRouteModalOpen(false);
      loadTransportData();
    } catch {
      toastError('Failed to create route');
    }
  };

  const openEditRouteModal = (r: TransportRoute) => {
    setEditingRoute(r);
    const existing = availableCities.includes(r.city || '');
    setEditRouteForm({
      cityMode: existing ? 'existing' : 'new',
      selectedCity: existing ? (r.city || availableCities[0] || '') : (availableCities[0] || ''),
      newCity: existing ? '' : (r.city || ''),
      routeName: r.route_name,
      routeCode: r.route_code || '',
      assignedVehicleId: r.assigned_vehicle_id || '',
      status: (r.status as any) || 'active',
      stops: (r.stops || []).map((s, idx) => ({
        id: s.id,
        city: s.city || r.city || '',
        stop_name: s.stop_name,
        estimated_pickup_time: s.estimated_pickup_time || '07:30 AM',
        estimated_drop_time: s.estimated_drop_time || '02:30 PM',
        stop_order: s.stop_order || idx + 1,
      })),
    });
  };

  const handleAddStopToCreateRoute = () => {
    setRouteForm({
      ...routeForm,
      stops: [
        ...routeForm.stops,
        {
          stop_name: `New Pickup Point ${routeForm.stops.length + 1}`,
          estimated_pickup_time: '07:45 AM',
          estimated_drop_time: '02:45 PM',
          stop_order: routeForm.stops.length + 1,
        },
      ],
    });
  };

  const handleRemoveStopFromCreateRoute = (index: number) => {
    const updated = routeForm.stops.filter((_, idx) => idx !== index);
    setRouteForm({
      ...routeForm,
      stops: updated.map((s, idx) => ({ ...s, stop_order: idx + 1 })),
    });
  };

  const handleAddStopToEditRoute = () => {
    const currentCity = editRouteForm.cityMode === 'existing' ? editRouteForm.selectedCity : editRouteForm.newCity;
    setEditRouteForm({
      ...editRouteForm,
      stops: [
        ...editRouteForm.stops,
        {
          stop_name: `New Pickup Point ${editRouteForm.stops.length + 1}`,
          city: currentCity,
          estimated_pickup_time: '07:45 AM',
          estimated_drop_time: '02:45 PM',
          stop_order: editRouteForm.stops.length + 1,
        },
      ],
    });
  };

  const handleRemoveStopFromEditRoute = (index: number) => {
    const updated = editRouteForm.stops.filter((_, idx) => idx !== index);
    setEditRouteForm({
      ...editRouteForm,
      stops: updated.map((s, idx) => ({ ...s, stop_order: idx + 1 })),
    });
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    const effectiveCity =
      editRouteForm.cityMode === 'existing'
        ? editRouteForm.selectedCity.trim()
        : editRouteForm.newCity.trim();

    if (!effectiveCity) {
      toastError('Please choose or enter a City / Area name');
      return;
    }

    try {
      const formattedStops: TransportStop[] = editRouteForm.stops.map((st, idx) => ({
        id: st.id || `stp-${Date.now()}-${idx}`,
        school_id: schoolId,
        city: effectiveCity,
        route_id: editingRoute.id,
        stop_name: st.stop_name,
        estimated_pickup_time: st.estimated_pickup_time,
        estimated_drop_time: st.estimated_drop_time,
        stop_order: idx + 1,
        created_at: new Date().toISOString(),
      }));

      await transportService.updateRoute(
        editingRoute.id,
        {
          city: effectiveCity,
          route_name: editRouteForm.routeName.trim(),
          route_code: editRouteForm.routeCode.trim(),
          assigned_vehicle_id: editRouteForm.assignedVehicleId || undefined,
          status: editRouteForm.status,
        },
        formattedStops
      );

      success('Route, City & Pickup points updated successfully');
      setEditingRoute(null);
      loadTransportData();
    } catch {
      toastError('Failed to update route');
    }
  };

  const handleDeleteRoute = async (r: TransportRoute) => {
    if (!confirmDeleteTwice(`Route "${r.route_name}"`)) return;
    try {
      await transportService.deleteRoute(r.id);
      success('Route removed');
      loadTransportData();
    } catch {
      toastError('Failed to delete route');
    }
  };

  // --------------------------------------------------------------------------
  // STUDENT ASSIGNMENT CRUD HANDLERS
  // --------------------------------------------------------------------------
  const openAssignModal = () => {
    setStudentSearchQuery('');
    const defaultCity = availableCities[0] || '';
    const cityRoutes = defaultCity ? routes.filter((r) => (r.city || '').toLowerCase() === defaultCity.toLowerCase()) : routes;
    const defaultRoute = cityRoutes[0] || routes[0] || null;
    const defaultStop = defaultRoute?.stops?.[0] || null;

    setAssignForm({
      studentId: '',
      city: defaultCity,
      routeId: defaultRoute?.id || '',
      stopId: defaultStop?.id || '',
      vehicleId: defaultRoute?.assigned_vehicle_id || vehicles[0]?.id || '',
      pickupEnabled: true,
    });
    setIsAssignStudentModalOpen(true);
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.studentId) {
      toastError('Please select a student');
      return;
    }
    if (!assignForm.city) {
      toastError('Please select a city / area');
      return;
    }
    if (!assignForm.routeId) {
      toastError('Please select a route');
      return;
    }
    if (!assignForm.stopId) {
      toastError('Please select a pickup point');
      return;
    }

    try {
      const selectedRoute = routes.find((r) => r.id === assignForm.routeId);
      const vehicleId = selectedRoute?.assigned_vehicle_id || assignForm.vehicleId || vehicles[0]?.id || '';

      await transportService.assignStudentTransport({
        school_id: schoolId,
        student_id: assignForm.studentId,
        city: assignForm.city,
        vehicle_id: vehicleId,
        route_id: assignForm.routeId,
        stop_id: assignForm.stopId,
        pickup_enabled: assignForm.pickupEnabled,
        drop_enabled: true,
        status: 'active',
      });

      if (!selectedRoute?.assigned_vehicle_id) {
        success('Student assigned! Remember to link a vehicle to this route so drivers can see them.');
      } else {
        success('Student assigned to transport pickup point');
      }
      setIsAssignStudentModalOpen(false);
      setStudentSearchQuery('');
      loadTransportData();
    } catch {
      toastError('Failed to assign student');
    }
  };

  const openEditAssignmentModal = (asg: StudentTransportAssignment) => {
    setEditingAssignment(asg);
    setEditAssignForm({
      city: asg.city || availableCities[0] || '',
      vehicleId: asg.vehicle_id,
      routeId: asg.route_id,
      stopId: asg.stop_id,
      status: (asg.status as any) || 'active',
    });
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    try {
      const targetRoute = routes.find((r) => r.id === editAssignForm.routeId);
      const vehicleId = targetRoute?.assigned_vehicle_id || editAssignForm.vehicleId || vehicles[0]?.id || '';

      await transportService.updateStudentAssignment(editingAssignment.id, {
        city: editAssignForm.city,
        vehicle_id: vehicleId,
        route_id: editAssignForm.routeId,
        stop_id: editAssignForm.stopId,
        status: editAssignForm.status,
      });

      success('Commuter assignment updated successfully');
      setEditingAssignment(null);
      loadTransportData();
    } catch {
      toastError('Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (asg: StudentTransportAssignment) => {
    const student = students.find((s) => s.id === asg.student_id);
    const sName = student ? `${student.first_name} ${student.last_name}` : 'this student';
    if (!confirmDeleteTwice(`${sName} from transport`)) return;
    try {
      await transportService.deleteStudentAssignment(asg.id);
      success('Student commuter removed from transport');
      loadTransportData();
    } catch {
      toastError('Failed to remove assignment');
    }
  };

  // --------------------------------------------------------------------------
  // LIVE EVENT OVERRIDE HANDLERS
  // --------------------------------------------------------------------------
  const handleAdminRecordEvent = async (
    studentId: string,
    vehicleId: string,
    stopId: string,
    eventType: 'picked_up' | 'dropped_off' | 'not_riding'
  ) => {
    try {
      const student = students.find((s) => s.id === studentId);
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      const todayStr = new Date().toISOString().split('T')[0];

      await transportService.recordTransportEvent({
        school_id: schoolId,
        student_id: studentId,
        vehicle_id: vehicleId,
        stop_id: stopId,
        event_type: eventType,
        event_date: todayStr,
        event_time: new Date().toISOString(),
        student_name: student ? `${student.first_name} ${student.last_name}` : undefined,
        vehicle_name: vehicle?.vehicle_name,
        recorded_by_name: 'School Administrator',
      });

      success(`Marked ${eventType === 'picked_up' ? 'Picked Up' : 'Not Present'}`);
      loadTransportData();
    } catch {
      toastError('Failed to update pickup status');
    }
  };

  const handleAdminRevertEvent = async (studentId: string) => {
    try {
      await transportService.revertTransportEvent(studentId);
      success('Reset status to Pending');
      loadTransportData();
    } catch {
      toastError('Failed to reset status');
    }
  };

  return (
    <FeatureGuard feature="transport">
      <div className="space-y-6 text-left w-full max-w-[1600px] mx-auto pb-12">
        {/* Modern Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                Fleet & Logistics
              </span>
              <span className="text-xs text-slate-400 font-medium">• Live Control Center</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bus className="w-6 h-6 text-indigo-600 shrink-0" />
              <span>Transport & Fleet Operations</span>
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Monitor active morning & afternoon bus runs, manage fleet vehicles, configure stop routes, and assign student commuters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVehicleModalOpen(true)}
              className="text-xs font-semibold shadow-2xs hover:border-slate-300"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Vehicle</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openCreateRouteModalForCity()}
              className="text-xs font-semibold shadow-2xs hover:border-slate-300"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Route & Stops</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={openAssignModal}
              className="text-xs font-semibold shadow-xs bg-indigo-600 hover:bg-indigo-700"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assign Commuter</span>
            </Button>
          </div>
        </div>

        {/* Executive KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Fleet Vehicles</span>
              <Bus className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{dashboardStats.vehiclesActive}</span>
              <span className="text-[11px] font-medium text-emerald-600">Active</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Routes</span>
              <Navigation className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{dashboardStats.routesRunning}</span>
              <span className="text-[11px] font-medium text-slate-500">Configured</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs space-y-2 bg-gradient-to-br from-indigo-50/40 to-white">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Commuters</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-indigo-950 tracking-tight">{dashboardStats.totalStudents}</span>
              <span className="text-[11px] font-medium text-indigo-700">Enrolled</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-2 bg-gradient-to-br from-emerald-50/40 to-white">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Picked Up</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-950 tracking-tight">{dashboardStats.todayPickedUp}</span>
              <span className="text-[11px] font-semibold text-emerald-600">Boarded</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-2 bg-gradient-to-br from-amber-50/40 to-white">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-amber-950 tracking-tight">{dashboardStats.todayPending}</span>
              <span className="text-[11px] font-medium text-amber-700">Awaiting</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs space-y-2 bg-gradient-to-br from-rose-50/40 to-white">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Not Riding</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-rose-950 tracking-tight">{dashboardStats.todayNotRiding}</span>
              <span className="text-[11px] font-medium text-rose-700">Absent</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <Tabs
            tabs={[
              { id: 'overview', label: `Today's Live Status (${assignments.length})` },
              { id: 'vehicles', label: `Fleet & Vehicles (${vehicles.length})` },
              { id: 'routes', label: `Routes & Stops (${routes.length})` },
              { id: 'students', label: `Passenger Directory (${assignments.length})` },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
          />
        </div>

        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW / TODAY'S LIVE RUN                                  */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Live Filter & Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOverviewStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    overviewStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Commuters ({assignments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewStatusFilter('picked_up')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    overviewStatusFilter === 'picked_up'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Picked Up ({dashboardStats.todayPickedUp})
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    overviewStatusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Pending ({dashboardStats.todayPending})
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewStatusFilter('not_riding')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    overviewStatusFilter === 'not_riding'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Not Riding ({dashboardStats.todayNotRiding})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student, bus, stop..."
                    value={overviewSearch}
                    onChange={(e) => setOverviewSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <select
                  value={overviewRouteFilter}
                  onChange={(e) => setOverviewRouteFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Routes</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name} ({r.route_code || 'RT'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Boarding Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Student Commuter</th>
                      <th className="py-3 px-3">Pickup Stop & Route</th>
                      <th className="py-3 px-3">Assigned Fleet Bus</th>
                      <th className="py-3 px-3">Live Status</th>
                      <th className="py-3 px-3">Recorded Time</th>
                      <th className="py-3 px-3">Logged By</th>
                      <th className="py-3 px-4 text-right">Quick Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLiveAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-medium text-slate-500">No commuter boarding records found.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Adjust your search or filter above.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLiveAssignments.map((asg) => {
                        const student = students.find((s) => s.id === asg.student_id);
                        const todayEvt = todayEvents.find((e) => e.student_id === asg.student_id);
                        const matchedVehicle = vehicles.find((v) => v.id === asg.vehicle_id);

                        return (
                          <tr key={asg.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                                  {student?.first_name?.[0] || 'S'}{student?.last_name?.[0] || ''}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    href={`/admin/students/${asg.student_id}`}
                                    className="font-bold text-slate-900 hover:text-indigo-600 block truncate"
                                  >
                                    {student?.first_name} {student?.last_name}
                                  </Link>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                    <span>{student?.registration_number}</span>
                                    {student?.current_enrollment?.class_name && (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans font-semibold text-[10px]">
                                        {student.current_enrollment.class_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>{asg.stop_name || 'Designated Stop'}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <span>{asg.route_name || 'Route'}</span>
                                  <span>•</span>
                                  <span className="font-mono text-indigo-700 font-semibold">{asg.estimated_pickup_time || '07:20 AM'}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              {asg.vehicle_name ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Bus className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{asg.vehicle_name}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {asg.vehicle_number || matchedVehicle?.vehicle_number || '—'}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                                  <AlertCircle className="w-3 h-3" /> Unlinked Vehicle
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              {todayEvt ? (
                                todayEvt.event_type === 'picked_up' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    PICKED UP
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                    NOT PRESENT
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  PENDING
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-mono text-slate-500">
                              {todayEvt ? new Date(todayEvt.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>

                            <td className="py-3 px-3 font-medium text-slate-600">
                              {todayEvt?.recorded_by_name || '—'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {todayEvt ? (
                                <button
                                  onClick={() => handleAdminRevertEvent(asg.student_id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Reset status back to Pending"
                                >
                                  <RotateCcw className="w-3 h-3" /> Reset
                                </button>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleAdminRecordEvent(asg.student_id, asg.vehicle_id, asg.stop_id, 'picked_up')}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" /> Mark Picked
                                  </button>
                                  <button
                                    onClick={() => handleAdminRecordEvent(asg.student_id, asg.vehicle_id, asg.stop_id, 'not_riding')}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Not Present
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: FLEET & VEHICLES                                             */}
        {/* =================================================================== */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registered School Fleet</h3>
                <p className="text-xs text-slate-500">Each vehicle is operated by at most one licensed driver at a time.</p>
              </div>
              <Button size="sm" variant="primary" onClick={() => setIsVehicleModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Vehicle
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                  <Bus className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Vehicles in Fleet</h4>
                  <p className="text-xs text-slate-400">Click &quot;Add Vehicle&quot; to register your first school bus or mini van.</p>
                </div>
              ) : (
                vehicles.map((v) => {
                  const assignedDriver = drivers.find((d) => d.id === v.driver_id);
                  const driverName = v.driver_name || (assignedDriver ? `${assignedDriver.first_name} ${assignedDriver.last_name}` : null);
                  const driverPhone = v.driver_phone || assignedDriver?.phone || null;

                  // Active assigned commuters for this vehicle
                  const vehicleAssignedCount = assignments.filter((a) => {
                    if (a.status !== 'active') return false;
                    if (a.vehicle_id === v.id) return true;
                    const r = routes.find((rt) => rt.id === a.route_id);
                    return r?.assigned_vehicle_id === v.id;
                  }).length;

                  const capacity = v.capacity || 40;
                  const utilizationPct = Math.min(100, Math.round((vehicleAssignedCount / capacity) * 100));

                  // Routes operated by this vehicle
                  const operatingRoutes = routes.filter((r) => r.assigned_vehicle_id === v.id);

                  return (
                    <div
                      key={v.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between"
                    >
                      {/* Card Header */}
                      <div className="p-5 border-b border-slate-100 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shadow-2xs">
                              <Bus className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 tracking-tight">{v.vehicle_name}</h4>
                              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700 mt-0.5">
                                {v.vehicle_number}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={v.status} />
                        </div>

                        {/* Capacity Utilization Progress Bar */}
                        <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">Passenger Seating:</span>
                            <span className="font-bold text-slate-900">
                              {vehicleAssignedCount} / {capacity} seats ({utilizationPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                utilizationPct > 90 ? 'bg-rose-500' : utilizationPct > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${utilizationPct}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Assigned Driver Box */}
                        <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Assigned Driver (1 Max)
                          </span>
                          {driverName ? (
                            <div className="flex items-center justify-between pt-0.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center uppercase">
                                  {driverName[0]}
                                </div>
                                <span className="font-bold text-slate-900">{driverName}</span>
                              </div>
                              {driverPhone ? (
                                <a
                                  href={`tel:${driverPhone}`}
                                  className="text-[11px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{driverPhone}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">—</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 text-[11px] font-semibold mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>No Driver Assigned • Click Edit to assign</span>
                            </div>
                          )}
                        </div>

                        {/* Linked Routes */}
                        <div className="text-xs space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Operating Routes ({operatingRoutes.length})
                          </span>
                          {operatingRoutes.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic block">Not assigned to any routes yet</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {operatingRoutes.map((rt) => (
                                <span
                                  key={rt.id}
                                  className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold"
                                >
                                  {rt.route_name} ({rt.route_code || 'RT'})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditVehicleModal(v)}
                          className="text-xs flex items-center gap-1 bg-white hover:bg-slate-50"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVehicle(v)}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1 bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: CITIES, ROUTES & STOPS                                       */}
        {/* =================================================================== */}
        {activeTab === 'routes' && (
          <div className="space-y-5">
            {/* City Selector Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-900 block">Transport Zones & Cities</label>
                  <span className="text-[11px] text-slate-500">
                    {routes.length} routes configured across {availableCities.length} distinct service cities
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={cityFilterTab}
                  onChange={(e) => setCityFilterTab(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                >
                  <option value="all">📍 All Cities ({availableCities.length} Cities, {routes.length} Routes)</option>
                  {availableCities.map((c) => {
                    const count = (routesByCity[c] || []).length;
                    return (
                      <option key={c} value={c}>
                        📍 {c} ({count} {count === 1 ? 'Route' : 'Routes'})
                      </option>
                    );
                  })}
                </select>

                <Button size="sm" variant="primary" onClick={() => openCreateRouteModalForCity()}>
                  <Plus className="w-3.5 h-3.5" /> Add Route
                </Button>
              </div>
            </div>

            {routes.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <Navigation className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Routes Configured</h4>
                <p className="text-xs text-slate-400">Click &quot;Add Route&quot; to set up pickup points and assign a fleet vehicle.</p>
              </div>
            ) : (
              (cityFilterTab === 'all' ? availableCities : [cityFilterTab]).map((cityName) => {
                const cityRoutes = routesByCity[cityName] || [];
                if (cityRoutes.length === 0 && cityFilterTab === 'all') return null;

                return (
                  <div key={cityName} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                    {/* City Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{cityName}</h3>
                          <span className="text-[11px] text-slate-400">{cityRoutes.length} active routes in this zone</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCreateRouteModalForCity(cityName)}
                        className="text-xs font-semibold"
                      >
                        <Plus className="w-3 h-3 text-indigo-600" />
                        <span>Add Route in {cityName}</span>
                      </Button>
                    </div>

                    {/* Routes under this City */}
                    <div className="grid grid-cols-1 gap-4">
                      {cityRoutes.map((r) => {
                        const matchedVeh = vehicles.find((v) => v.id === r.assigned_vehicle_id);
                        const assignedDriver = matchedVeh ? drivers.find((d) => d.id === matchedVeh.driver_id) : null;
                        const driverName = matchedVeh?.driver_name || (assignedDriver ? `${assignedDriver.first_name} ${assignedDriver.last_name}` : null);
                        const routeCommuterCount = assignments.filter((a) => a.route_id === r.id && a.status === 'active').length;

                        return (
                          <div key={r.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-slate-900">{r.route_name}</h4>
                                  <span className="text-[10px] font-mono font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                    {r.route_code || 'RT'}
                                  </span>
                                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {routeCommuterCount} Commuters
                                  </span>
                                </div>

                                {matchedVeh ? (
                                  <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold pt-0.5 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Bus className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Bus: <strong>{matchedVeh.vehicle_name} ({matchedVeh.vehicle_number})</strong></span>
                                    </span>
                                    {driverName && (
                                      <span className="text-slate-500 font-normal">
                                        • Driver: <strong className="text-slate-800">{driverName}</strong>
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex mt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                    <span>No Fleet Vehicle Assigned (Driver Dashboards will not see this route)</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={r.status || 'active'} />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditRouteModal(r)}
                                  className="text-xs flex items-center gap-1 bg-white hover:bg-slate-50"
                                >
                                  <Edit3 className="w-3 h-3 text-indigo-600" />
                                  <span>Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRoute(r)}
                                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1 bg-white"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </Button>
                              </div>
                            </div>

                            {/* Stops Sequence */}
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Pickup Points Sequence ({(r.stops || []).length} Stops):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {(r.stops || []).map((st, idx) => (
                                  <div
                                    key={st.id || idx}
                                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2 font-bold text-slate-900">
                                      <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="truncate">{st.stop_name}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex justify-between font-mono bg-slate-50 px-2 py-1 rounded-md">
                                      <span>Pickup: <strong>{st.estimated_pickup_time}</strong></span>
                                      {st.estimated_drop_time && <span>Drop: <strong>{st.estimated_drop_time}</strong></span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: STUDENT PASSENGER LIST                                       */}
        {/* =================================================================== */}
        {activeTab === 'students' && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Enrolled Student Commuters</h4>
                <p className="text-xs text-slate-500">Students registered for daily bus pickup and drop-off runs.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search commuter by name, reg, or stop..."
                    value={studentSearchTable}
                    onChange={(e) => setStudentSearchTable(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <select
                  value={tableRouteFilter}
                  onChange={(e) => setTableRouteFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Routes</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name}
                    </option>
                  ))}
                </select>

                <Button size="sm" variant="primary" onClick={openAssignModal}>
                  <Plus className="w-3.5 h-3.5" /> Assign Commuter
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">City / Area</th>
                    <th className="py-2.5 px-3">Vehicle & Driver</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Pickup Stop</th>
                    <th className="py-2.5 px-3">Expected Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {studentSearchTable ? `No student commuters found matching "${studentSearchTable}"` : 'No assigned student commuters yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((asg) => {
                      const student = students.find((s) => s.id === asg.student_id);
                      return (
                        <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                                {student?.first_name?.[0] || 'S'}
                              </div>
                              <div className="min-w-0">
                                <Link href={`/admin/students/${asg.student_id}`} className="font-bold text-slate-900 hover:text-indigo-600 block truncate">
                                  {student?.first_name} {student?.last_name}
                                </Link>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">{student?.registration_number}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {asg.city || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            <div>{asg.vehicle_name || '—'}</div>
                            <span className="text-[11px] text-indigo-600 font-semibold block">{asg.driver_name || 'Driver'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{asg.route_name || '—'}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{asg.stop_name || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-indigo-700 font-bold">{asg.estimated_pickup_time || '07:20 AM'}</td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={asg.status} />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditAssignmentModal(asg)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Assignment"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(asg)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove from Transport"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* CREATE VEHICLE MODAL (1 DRIVER 1 VEHICLE ENFORCED)                   */}
        {/* =================================================================== */}
        <Modal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          title="Add Vehicle to School Fleet"
          description="Register school bus, mini van, or traveler with an assigned driver"
        >
          <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School Bus 1"
                  value={vehicleForm.vehicleName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration / Plate No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-01-AB-1234"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={vehicleForm.type}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="bus">School Bus</option>
                  <option value="van">Mini Van</option>
                  <option value="other">Other Fleet</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min={5}
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={vehicleForm.status}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Assigned Driver (1 Driver Max)</label>
                <span className="text-[10px] text-slate-400">1 driver = 1 vehicle</span>
              </div>
              <select
                value={vehicleForm.driverId}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="">No Driver Assigned (Unassigned)</option>
                {drivers.map((d) => {
                  const assignedVeh = getAssignedVehicleForDriver(d.id);
                  const isBusy = !!assignedVeh;
                  return (
                    <option
                      key={d.id}
                      value={d.id}
                      disabled={isBusy}
                      className={isBusy ? 'text-slate-400 bg-slate-50' : 'text-slate-900'}
                    >
                      {d.first_name} {d.last_name} {d.phone ? `(${d.phone})` : ''}
                      {isBusy ? ` — [Already assigned to ${assignedVeh.vehicle_name} (${assignedVeh.vehicle_number})]` : ' — Available'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsVehicleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Vehicle
              </Button>
            </div>
          </form>
        </Modal>

        {/* =================================================================== */}
        {/* EDIT VEHICLE MODAL (1 DRIVER 1 VEHICLE ENFORCED)                     */}
        {/* =================================================================== */}
        <Modal
          isOpen={!!editingVehicle}
          onClose={() => setEditingVehicle(null)}
          title={`Edit Vehicle: ${editingVehicle?.vehicle_name || ''}`}
          description="Update fleet details, capacity, and driver assignment"
        >
          <form onSubmit={handleUpdateVehicle} className="space-y-4 text-xs text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  value={editVehicleForm.vehicleName}
                  onChange={(e) => setEditVehicleForm({ ...editVehicleForm, vehicleName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">License Plate Number *</label>
                <input
                  type="text"
                  required
                  value={editVehicleForm.vehicleNumber}
                  onChange={(e) => setEditVehicleForm({ ...editVehicleForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={editVehicleForm.type}
                  onChange={(e) => setEditVehicleForm({ ...editVehicleForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="bus">School Bus</option>
                  <option value="van">Mini Van</option>
                  <option value="other">Other Fleet</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min={5}
                  value={editVehicleForm.capacity}
                  onChange={(e) => setEditVehicleForm({ ...editVehicleForm, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editVehicleForm.status}
                  onChange={(e) => setEditVehicleForm({ ...editVehicleForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Assigned Driver (1 Driver Max)</label>
                <span className="text-[10px] text-slate-400">1 driver = 1 vehicle</span>
              </div>
              <select
                value={editVehicleForm.driverId}
                onChange={(e) => setEditVehicleForm({ ...editVehicleForm, driverId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="">No Driver Assigned (Unassigned)</option>
                {drivers.map((d) => {
                  const assignedVeh = getAssignedVehicleForDriver(d.id, editingVehicle?.id);
                  const isBusy = !!assignedVeh;
                  return (
                    <option
                      key={d.id}
                      value={d.id}
                      disabled={isBusy}
                      className={isBusy ? 'text-slate-400 bg-slate-50' : 'text-slate-900'}
                    >
                      {d.first_name} {d.last_name} {d.phone ? `(${d.phone})` : ''}
                      {isBusy ? ` — [Already assigned to ${assignedVeh.vehicle_name} (${assignedVeh.vehicle_number})]` : ' — Available'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingVehicle(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* =================================================================== */}
        {/* CREATE ROUTE & PICKUP POINTS MODAL                                  */}
        {/* =================================================================== */}
        <Modal
          isOpen={isRouteModalOpen}
          onClose={() => setIsRouteModalOpen(false)}
          title="Add City Route & Pickup Points"
          description="Choose or create a city, define route details, and configure pickup stops"
        >
          <form onSubmit={handleCreateRoute} className="space-y-5 text-xs text-left">
            {/* STEP 1: CITY SELECTION / CREATION */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  1. City / Transport Zone <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setRouteForm({ ...routeForm, cityMode: 'existing' })}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      routeForm.cityMode === 'existing' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Choose Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteForm({ ...routeForm, cityMode: 'new' })}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      routeForm.cityMode === 'new' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Create New City
                  </button>
                </div>
              </div>

              {routeForm.cityMode === 'existing' && availableCities.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={routeForm.selectedCity}
                    onChange={(e) => setRouteForm({ ...routeForm, selectedCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold text-slate-800"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        📍 {c}
                      </option>
                    ))}
                  </select>

                  {existingRoutesInSelectedCity.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-950">
                      <span className="font-bold block mb-1">Existing routes in {routeForm.selectedCity}:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {existingRoutesInSelectedCity.map((er) => (
                          <span key={er.id} className="bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-semibold text-indigo-700">
                            {er.route_name} ({er.stops?.length || 0} stops)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter city or area name (e.g. Barrackpore, Khardaha)"
                    value={routeForm.newCity}
                    onChange={(e) => setRouteForm({ ...routeForm, newCity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This city will be saved and available for all future routes & stops.</p>
                </div>
              )}
            </div>

            {/* STEP 2: ROUTE SPECIFICATION */}
            <div className="space-y-3">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                2. Route Details
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Route Name *</label>
                  <input
                    type="text"
                    required
                    value={routeForm.routeName}
                    onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                    placeholder="e.g. Barrackpore Express"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Route Code *</label>
                  <input
                    type="text"
                    required
                    value={routeForm.routeCode}
                    onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                    placeholder="e.g. BKP-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Fleet Vehicle (Optional)</label>
                <select
                  value={routeForm.assignedVehicleId}
                  onChange={(e) => setRouteForm({ ...routeForm, assignedVehicleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="">Select Fleet Vehicle (Optional)</option>
                  {vehicles.map((v) => {
                    const drv = v.driver_name || (drivers.find((d) => d.id === v.driver_id) ? `${drivers.find((d) => d.id === v.driver_id)?.first_name} ${drivers.find((d) => d.id === v.driver_id)?.last_name}` : null);
                    return (
                      <option key={v.id} value={v.id}>
                        🚌 {v.vehicle_name} ({v.vehicle_number}) • Driver: {drv || 'Not Assigned'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Linking a vehicle allows the driver of that vehicle to view passengers on this route.
                </p>
              </div>
            </div>

            {/* STEP 3: PICKUP POINTS (STOPS) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  3. Pickup Points & Timings ({routeForm.stops.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddStopToCreateRoute}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pickup Point
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {routeForm.stops.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Stop Name (e.g. Gandhi More)"
                      value={st.stop_name}
                      onChange={(e) => {
                        const updated = [...routeForm.stops];
                        updated[idx].stop_name = e.target.value;
                        setRouteForm({ ...routeForm, stops: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Pickup (07:20 AM)"
                      value={st.estimated_pickup_time}
                      onChange={(e) => {
                        const updated = [...routeForm.stops];
                        updated[idx].estimated_pickup_time = e.target.value;
                        setRouteForm({ ...routeForm, stops: updated });
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Drop (02:30 PM)"
                      value={st.estimated_drop_time}
                      onChange={(e) => {
                        const updated = [...routeForm.stops];
                        updated[idx].estimated_drop_time = e.target.value;
                        setRouteForm({ ...routeForm, stops: updated });
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono"
                    />
                    {routeForm.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStopFromCreateRoute(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRouteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Route & Pickup Points
              </Button>
            </div>
          </form>
        </Modal>

        {/* =================================================================== */}
        {/* EDIT ROUTE & STOPS MODAL                                            */}
        {/* =================================================================== */}
        <Modal
          isOpen={!!editingRoute}
          onClose={() => setEditingRoute(null)}
          title={`Edit Route: ${editingRoute?.route_name || ''}`}
          description="Update city, route details, vehicle linking, and manage pickup points"
        >
          <form onSubmit={handleUpdateRoute} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" /> City / Zone *
                </label>
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setEditRouteForm({ ...editRouteForm, cityMode: 'existing' })}
                    className={`px-2 py-0.5 rounded ${
                      editRouteForm.cityMode === 'existing' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRouteForm({ ...editRouteForm, cityMode: 'new' })}
                    className={`px-2 py-0.5 rounded ${
                      editRouteForm.cityMode === 'new' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    + New City
                  </button>
                </div>
              </div>

              {editRouteForm.cityMode === 'existing' && availableCities.length > 0 ? (
                <select
                  value={editRouteForm.selectedCity}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, selectedCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold text-slate-800"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      📍 {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="Enter city or area name"
                  value={editRouteForm.newCity}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, newCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  value={editRouteForm.routeName}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, routeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Route Code *</label>
                <input
                  type="text"
                  required
                  value={editRouteForm.routeCode}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, routeCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Fleet Vehicle</label>
                <select
                  value={editRouteForm.assignedVehicleId}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, assignedVehicleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="">No Vehicle Assigned</option>
                  {vehicles.map((v) => {
                    const drv = v.driver_name || (drivers.find((d) => d.id === v.driver_id) ? `${drivers.find((d) => d.id === v.driver_id)?.first_name} ${drivers.find((d) => d.id === v.driver_id)?.last_name}` : null);
                    return (
                      <option key={v.id} value={v.id}>
                        🚌 {v.vehicle_name} ({v.vehicle_number}) • Driver: {drv || 'Not Assigned'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editRouteForm.status}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Stops Management */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Pickup Points & Timings ({editRouteForm.stops.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddStopToEditRoute}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pickup Point
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {editRouteForm.stops.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Stop Name"
                      value={st.stop_name}
                      onChange={(e) => {
                        const updated = [...editRouteForm.stops];
                        updated[idx].stop_name = e.target.value;
                        setEditRouteForm({ ...editRouteForm, stops: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Pickup"
                      value={st.estimated_pickup_time}
                      onChange={(e) => {
                        const updated = [...editRouteForm.stops];
                        updated[idx].estimated_pickup_time = e.target.value;
                        setEditRouteForm({ ...editRouteForm, stops: updated });
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Drop"
                      value={st.estimated_drop_time}
                      onChange={(e) => {
                        const updated = [...editRouteForm.stops];
                        updated[idx].estimated_drop_time = e.target.value;
                        setEditRouteForm({ ...editRouteForm, stops: updated });
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-mono"
                    />
                    {editRouteForm.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStopFromEditRoute(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingRoute(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Route & Pickup Points
              </Button>
            </div>
          </form>
        </Modal>

        {/* =================================================================== */}
        {/* ASSIGN STUDENT MODAL (WITH PROMINENT VEHICLE STATUS)                 */}
        {/* =================================================================== */}
        <Modal
          isOpen={isAssignStudentModalOpen}
          onClose={() => setIsAssignStudentModalOpen(false)}
          title="Assign Student to Transport Pickup Point"
          description="Select a student, choose their city and route, then link them to a pickup stop"
        >
          <form onSubmit={handleAssignStudent} className="space-y-4 text-xs text-left">
            {/* 1. Searchable Student Selection */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                1. Select Student <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, registration no, or class..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {selectedStudent && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {selectedStudent.first_name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-xs text-indigo-950 truncate">
                          {selectedStudent.first_name || ''} {selectedStudent.last_name || ''}
                        </span>
                        {selectedStudent.current_enrollment?.class_name && (
                          <span className="text-[10px] font-semibold bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                            {selectedStudent.current_enrollment.class_name}
                            {selectedStudent.current_enrollment?.section_name ? ` (${selectedStudent.current_enrollment.section_name})` : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-mono block truncate">
                        Reg: {selectedStudent.registration_number} {selectedStudent.current_enrollment?.roll_number ? `• Roll #${selectedStudent.current_enrollment.roll_number}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ml-2">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                </div>
              )}

              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5">
                {filteredModalStudents.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No students found matching &quot;{studentSearchQuery}&quot;
                  </div>
                ) : (
                  filteredModalStudents.map((st) => {
                    const isSelected = assignForm.studentId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAssignForm({ ...assignForm, studentId: st.id })}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                            {st.first_name?.[0] || 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs truncate">
                                {st.first_name} {st.last_name}
                              </span>
                              {st.current_enrollment?.class_name && (
                                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded shrink-0">
                                  {st.current_enrollment.class_name}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              Reg: {st.registration_number || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Choose City / Area */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                2. Choose City / Area <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={assignForm.city}
                onChange={(e) => {
                  const newCity = e.target.value;
                  const newCityRoutes = routes.filter((r) => (r.city || '').toLowerCase() === newCity.toLowerCase());
                  const firstRoute = newCityRoutes[0] || null;
                  const firstStop = firstRoute?.stops?.[0] || null;

                  setAssignForm({
                    ...assignForm,
                    city: newCity,
                    routeId: firstRoute?.id || '',
                    stopId: firstStop?.id || '',
                    vehicleId: firstRoute?.assigned_vehicle_id || assignForm.vehicleId || vehicles[0]?.id || '',
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold text-slate-800"
              >
                <option value="">Select City / Area</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Select Route in City */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  3. Select Route in {assignForm.city || 'City'} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => openCreateRouteModalForCity(assignForm.city || undefined)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Route
                </button>
              </div>

              {routesInSelectedCity.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                  <span>No routes in {assignForm.city || 'this area'}.</span>
                  <button
                    type="button"
                    onClick={() => openCreateRouteModalForCity(assignForm.city || undefined)}
                    className="font-bold underline text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    + Create Route
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={assignForm.routeId}
                  onChange={(e) => {
                    const newRouteId = e.target.value;
                    const r = routes.find((rt) => rt.id === newRouteId);
                    const firstStop = r?.stops?.[0] || null;
                    setAssignForm({
                      ...assignForm,
                      routeId: newRouteId,
                      stopId: firstStop?.id || '',
                      vehicleId: r?.assigned_vehicle_id || assignForm.vehicleId,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="">Select Route</option>
                  {routesInSelectedCity.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name} ({r.route_code || 'RT'}) • {(r.stops || []).length} Stops
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 4. Choose Pickup Point from Selected Route */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                4. Choose Pickup Point <span className="text-rose-500">*</span>
              </label>
              {stopsInSelectedRoute.length === 0 ? (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                  No pickup points configured for this route. Edit the route to add pickup points.
                </div>
              ) : (
                <select
                  required
                  value={assignForm.stopId}
                  onChange={(e) => setAssignForm({ ...assignForm, stopId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="">Select Pickup Point</option>
                  {stopsInSelectedRoute.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.stop_name} (Pickup: {st.estimated_pickup_time}{st.estimated_drop_time ? ` • Drop: ${st.estimated_drop_time}` : ''})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Auto-selected Route Bus & Driver Status Card */}
            {(() => {
              const selectedR = routes.find((r) => r.id === assignForm.routeId);
              if (!selectedR) return null;
              const matchedVeh = vehicles.find((v) => v.id === selectedR.assigned_vehicle_id);

              if (matchedVeh) {
                const assignedDriver = drivers.find((d) => d.id === matchedVeh.driver_id);
                const dName = matchedVeh.driver_name || (assignedDriver ? `${assignedDriver.first_name} ${assignedDriver.last_name}` : null);
                return (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Assigned Fleet Bus: {matchedVeh.vehicle_name} ({matchedVeh.vehicle_number})
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Driver: {dName ? <strong>{dName}</strong> : <span className="italic">Unassigned</span>}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      Driver Linked
                    </span>
                  </div>
                );
              }

              return (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>⚠️ Warning: Route Has No Vehicle Linked</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Route <strong>&quot;{selectedR.route_name}&quot;</strong> does not have a vehicle or driver assigned. Students assigned to this route will <strong>not appear on any driver&apos;s portal</strong> until you link a bus in &quot;Cities, Routes &amp; Stops&quot;.
                  </p>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignStudentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>

        {/* =================================================================== */}
        {/* EDIT ASSIGNMENT MODAL                                               */}
        {/* =================================================================== */}
        <Modal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          title="Edit Commuter Transport Assignment"
          description="Update city, route, pickup stop, vehicle, or commuter status"
        >
          <form onSubmit={handleUpdateAssignment} className="space-y-4 text-xs text-left">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Area *</label>
              <select
                required
                value={editAssignForm.city}
                onChange={(e) => {
                  const newCity = e.target.value;
                  const newCityRoutes = routes.filter((r) => (r.city || '').toLowerCase() === newCity.toLowerCase());
                  const firstRoute = newCityRoutes[0] || null;
                  const firstStop = firstRoute?.stops?.[0] || null;

                  setEditAssignForm({
                    ...editAssignForm,
                    city: newCity,
                    routeId: firstRoute?.id || '',
                    stopId: firstStop?.id || '',
                    vehicleId: firstRoute?.assigned_vehicle_id || editAssignForm.vehicleId,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="">Select City / Area</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Route in {editAssignForm.city || 'Area'} *</label>
                <button
                  type="button"
                  onClick={() => openCreateRouteModalForCity(editAssignForm.city || undefined)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Route
                </button>
              </div>
              <select
                required
                value={editAssignForm.routeId}
                onChange={(e) => {
                  const newRouteId = e.target.value;
                  const r = routes.find((rt) => rt.id === newRouteId);
                  const firstStop = r?.stops?.[0] || null;
                  setEditAssignForm({
                    ...editAssignForm,
                    routeId: newRouteId,
                    stopId: firstStop?.id || '',
                    vehicleId: r?.assigned_vehicle_id || editAssignForm.vehicleId,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="">Select Route</option>
                {routesInEditCity.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.route_name} ({r.route_code || 'RT'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pickup Stop *</label>
              <select
                required
                value={editAssignForm.stopId}
                onChange={(e) => setEditAssignForm({ ...editAssignForm, stopId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="">Select Stop</option>
                {stopsInEditRoute.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.stop_name} ({st.estimated_pickup_time})
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-selected Route Bus & Driver Status Card */}
            {(() => {
              const selectedR = routes.find((r) => r.id === editAssignForm.routeId);
              if (!selectedR) return null;
              const matchedVeh = vehicles.find((v) => v.id === selectedR.assigned_vehicle_id);

              if (matchedVeh) {
                const assignedDriver = drivers.find((d) => d.id === matchedVeh.driver_id);
                const dName = matchedVeh.driver_name || (assignedDriver ? `${assignedDriver.first_name} ${assignedDriver.last_name}` : null);
                return (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Assigned Fleet Bus: {matchedVeh.vehicle_name} ({matchedVeh.vehicle_number})
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Driver: {dName ? <strong>{dName}</strong> : <span className="italic">Unassigned</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">⚠️ Notice: Route has no vehicle assigned</span>
                  <span className="text-[11px] text-amber-700 block">Link a vehicle in &quot;Cities, Routes &amp; Stops&quot; so drivers can see this student.</span>
                </div>
              );
            })()}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commuter Status</label>
              <select
                value={editAssignForm.status}
                onChange={(e) => setEditAssignForm({ ...editAssignForm, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingAssignment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Assignment
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </FeatureGuard>
  );
}
