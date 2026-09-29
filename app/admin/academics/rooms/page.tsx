'use client';

// ============================================================================
// Classroom & Facility Room Management (Classrooms, Labs, Library)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { roomService, academicService } from '@/lib/services/api';
import { SchoolRoom, RoomType, SchoolClass, Section } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { useToast } from '@/components/ui/toast';
import {
  Building,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function RoomsPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [rooms, setRooms] = useState<SchoolRoom[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Type Filter
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SchoolRoom | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    roomNumber: string;
    building: string;
    floor: string;
    type: RoomType;
    capacity: number;
    status: SchoolRoom['status'];
  }>({
    name: 'Classroom',
    roomNumber: '101',
    building: 'Main Academic Block',
    floor: 'Ground Floor',
    type: 'classroom',
    capacity: 40,
    status: 'active',
  });

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const [rList, clsList, secList] = await Promise.all([
        roomService.getRooms(schoolId),
        academicService.getClasses(schoolId),
        academicService.getSections(schoolId),
      ]);
      setRooms(rList);
      setClasses(clsList);
      setSections(secList);
    } catch {
      toastError('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [schoolId]);

  const handleSaveRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, {
          name: formData.name,
          room_number: formData.roomNumber,
          building: formData.building,
          floor: formData.floor,
          type: formData.type,
          capacity: formData.capacity,
          status: formData.status,
        });
        success('Room details updated successfully');
      } else {
        await roomService.createRoom({
          school_id: schoolId,
          name: formData.name,
          room_number: formData.roomNumber,
          building: formData.building,
          floor: formData.floor,
          type: formData.type,
          capacity: formData.capacity,
          status: formData.status,
        });
        success('New room created successfully');
      }
      setIsAddModalOpen(false);
      setEditingRoom(null);
      loadRooms();
    } catch {
      toastError('Failed to save room');
    }
  };

  const handleOpenEdit = (room: SchoolRoom) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      roomNumber: room.room_number,
      building: room.building || 'Main Academic Block',
      floor: room.floor || 'Ground Floor',
      type: room.type,
      capacity: room.capacity,
      status: room.status,
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room record?')) return;
    try {
      await roomService.deleteRoom(id);
      success('Room deleted');
      loadRooms();
    } catch {
      toastError('Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.building || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.floor || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const classroomCount = rooms.filter((r) => r.type === 'classroom').length;
  const labCount = rooms.filter((r) => r.type === 'lab').length;
  const libraryOfficeCount = rooms.filter((r) => r.type === 'library' || r.type === 'office').length;

  return (
    <div className="space-y-6 text-left w-full">
      {/* Back Link */}
      <Link
        href="/admin/academics/classes"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes & Sections
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-indigo-600" /> School Classrooms & Facilities
          </h1>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingRoom(null);
            setFormData({
              name: 'Classroom',
              roomNumber: `${Math.floor(100 + Math.random() * 300)}`,
              building: 'Main Academic Block',
              floor: 'First Floor',
              type: 'classroom',
              capacity: 40,
              status: 'active',
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Facilities</span>
          <span className="text-xl font-bold text-slate-900 mt-1">{rooms.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-700 block">Active Classrooms</span>
          <span className="text-xl font-bold text-indigo-800 mt-1">{classroomCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Labs & Activity Rooms</span>
          <span className="text-xl font-bold text-emerald-800 mt-1">{labCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <span className="text-[11px] font-semibold text-purple-700 block">Library & Administrative</span>
          <span className="text-xl font-bold text-purple-800 mt-1">{libraryOfficeCount}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rooms by number, name, building or floor..."
        filters={[
          {
            id: 'type',
            label: 'All Facility Types',
            value: typeFilter,
            options: [
              { label: 'All Facility Types', value: '' },
              { label: 'Classrooms', value: 'classroom' },
              { label: 'Laboratories', value: 'lab' },
              { label: 'Library', value: 'library' },
              { label: 'Administrative Office', value: 'office' },
              { label: 'Activity Room', value: 'activity_room' },
            ],
            onChange: setTypeFilter,
          },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Building className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No rooms found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Room Number & Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Building & Floor</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Assigned Class/Section</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRooms.map((room) => {
                  const assignedSection = sections.find((s) => s.room_id === room.id || s.room_number === room.room_number);
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 font-mono">
                            {room.room_number}
                          </div>
                          <div>
                            <strong className="block font-semibold text-slate-900">{room.name}</strong>
                            <span className="text-[11px] text-slate-400">Room {room.room_number}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            room.type === 'classroom'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : room.type === 'lab'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : room.type === 'library'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {room.type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{room.building}</span>
                        <span className="text-[11px] text-slate-400">{room.floor}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {room.capacity} students
                      </td>

                      <td className="py-3 px-4">
                        {assignedSection ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {assignedSection.class_name || 'Class'} {assignedSection.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned / Flexible</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={room.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(room)}>
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteRoom(room.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT ROOM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRoom(null);
        }}
        title={editingRoom ? `Edit Room: ${editingRoom.name}` : 'Add Facility Room'}
        description="Register classroom or facility location details in the school inventory"
      >
        <form onSubmit={handleSaveRoomSubmit} className="space-y-4 text-xs text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Classroom 8A or Chemistry Lab"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. 204"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Building *</label>
              <input
                type="text"
                required
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="e.g. Main Academic Block"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor *</label>
              <input
                type="text"
                required
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="e.g. Second Floor"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Science / Computer Lab</option>
                <option value="library">Library</option>
                <option value="office">Administrative Office</option>
                <option value="activity_room">Activity / Music Room</option>
                <option value="other">Other Facility</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Seating Capacity *</label>
              <input
                type="number"
                required
                min={5}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingRoom(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
