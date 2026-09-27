import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import 'class_attendance_detail_sheet.dart';

class AdminAttendanceView extends StatelessWidget {
  const AdminAttendanceView({super.key});

  List<StudentAttendanceDetail> _getClass10AStudents() {
    return [
      const StudentAttendanceDetail(
        id: 's1',
        name: 'Rahul Verma',
        rollNumber: '105',
        admissionNumber: 'ADM-2024-005',
        parentPhone: '+91 98765 43210',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 's2',
        name: 'Aarav Gupta',
        rollNumber: '101',
        admissionNumber: 'ADM-2024-001',
        parentPhone: '+91 98111 22334',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 's3',
        name: 'Ananya Iyer',
        rollNumber: '102',
        admissionNumber: 'ADM-2024-002',
        parentPhone: '+91 98222 33445',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 's4',
        name: 'Ishita Sharma',
        rollNumber: '104',
        admissionNumber: 'ADM-2024-004',
        parentPhone: '+91 98444 55667',
        status: StudentAttendanceState.onLeave,
        note: 'Medical Leave approved by Principal Anita Roy (2 Days)',
      ),
      const StudentAttendanceDetail(
        id: 's5',
        name: 'Devansh Mehra',
        rollNumber: '103',
        admissionNumber: 'ADM-2024-003',
        parentPhone: '+91 98333 44556',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 's6',
        name: 'Rohan Kapoor',
        rollNumber: '111',
        admissionNumber: 'ADM-2024-011',
        parentPhone: '+91 98555 66778',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • SMS alert sent to parent at 08:35 AM',
      ),
      const StudentAttendanceDetail(
        id: 's7',
        name: 'Meera Nair',
        rollNumber: '112',
        admissionNumber: 'ADM-2024-012',
        parentPhone: '+91 98666 77889',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • Parent phone not reachable',
      ),
      const StudentAttendanceDetail(
        id: 's8',
        name: 'Rhea Sen',
        rollNumber: '106',
        admissionNumber: 'ADM-2024-006',
        parentPhone: '+91 98555 11223',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 's9',
        name: 'Kabir Mehta',
        rollNumber: '107',
        admissionNumber: 'ADM-2024-007',
        parentPhone: '+91 98777 22334',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 's10',
        name: 'Sneha Rao',
        rollNumber: '108',
        admissionNumber: 'ADM-2024-008',
        parentPhone: '+91 98888 33445',
        status: StudentAttendanceState.present,
      ),
    ];
  }

  List<StudentAttendanceDetail> _getClass10BStudents() {
    return [
      const StudentAttendanceDetail(
        id: 'b1',
        name: 'Harsh Vardhan',
        rollNumber: '204',
        admissionNumber: 'ADM-2024-024',
        parentPhone: '+91 98123 45678',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • Parent notified via SMS',
      ),
      const StudentAttendanceDetail(
        id: 'b2',
        name: 'Diya Roy',
        rollNumber: '209',
        admissionNumber: 'ADM-2024-029',
        parentPhone: '+91 98234 56789',
        status: StudentAttendanceState.onLeave,
        note: 'Family Function Leave approved by Class Teacher',
      ),
      const StudentAttendanceDetail(
        id: 'b3',
        name: 'Siddharth Das',
        rollNumber: '218',
        admissionNumber: 'ADM-2024-038',
        parentPhone: '+91 98345 67890',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • Route bus delay reported',
      ),
      const StudentAttendanceDetail(
        id: 'b4',
        name: 'Simran Kaur',
        rollNumber: '201',
        admissionNumber: 'ADM-2024-021',
        parentPhone: '+91 98456 78901',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 'b5',
        name: 'Aryan Saxena',
        rollNumber: '202',
        admissionNumber: 'ADM-2024-022',
        parentPhone: '+91 98567 89012',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: 'b6',
        name: 'Pooja Reddy',
        rollNumber: '203',
        admissionNumber: 'ADM-2024-023',
        parentPhone: '+91 98678 90123',
        status: StudentAttendanceState.present,
      ),
    ];
  }

  List<StudentAttendanceDetail> _getClass9AStudents() {
    return [
      const StudentAttendanceDetail(
        id: '9a1',
        name: 'Aditya Kulkarni',
        rollNumber: '305',
        admissionNumber: 'ADM-2024-055',
        parentPhone: '+91 98789 01234',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • Parent acknowledged via App',
      ),
      const StudentAttendanceDetail(
        id: '9a2',
        name: 'Tanya Goel',
        rollNumber: '301',
        admissionNumber: 'ADM-2024-051',
        parentPhone: '+91 98890 12345',
        status: StudentAttendanceState.present,
      ),
      const StudentAttendanceDetail(
        id: '9a3',
        name: 'Manish Pandey',
        rollNumber: '302',
        admissionNumber: 'ADM-2024-052',
        parentPhone: '+91 98901 23456',
        status: StudentAttendanceState.present,
      ),
    ];
  }

  List<StudentAttendanceDetail> _getClass9BStudents() {
    return [
      const StudentAttendanceDetail(
        id: '9b1',
        name: 'Kunal Singh',
        rollNumber: '402',
        admissionNumber: 'ADM-2024-072',
        parentPhone: '+91 98012 34567',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • No call received from parent',
      ),
      const StudentAttendanceDetail(
        id: '9b2',
        name: 'Neha Bhatt',
        rollNumber: '408',
        admissionNumber: 'ADM-2024-078',
        parentPhone: '+91 98123 45670',
        status: StudentAttendanceState.onLeave,
        note: 'Inter-School Sports Meet Delegation (Track & Field)',
      ),
      const StudentAttendanceDetail(
        id: '9b3',
        name: 'Varun Chopra',
        rollNumber: '415',
        admissionNumber: 'ADM-2024-085',
        parentPhone: '+91 98234 56701',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • Dispatched SMS Alert',
      ),
      const StudentAttendanceDetail(
        id: '9b4',
        name: 'Pooja Hegde',
        rollNumber: '422',
        admissionNumber: 'ADM-2024-092',
        parentPhone: '+91 98345 67012',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence',
      ),
      const StudentAttendanceDetail(
        id: '9b5',
        name: 'Nikhil Aggarwal',
        rollNumber: '401',
        admissionNumber: 'ADM-2024-071',
        parentPhone: '+91 98456 70123',
        status: StudentAttendanceState.present,
      ),
    ];
  }

  List<StudentAttendanceDetail> _getClass11AStudents() {
    return [
      const StudentAttendanceDetail(
        id: '11a1',
        name: 'Aman Joshi',
        rollNumber: '512',
        admissionNumber: 'ADM-2024-112',
        parentPhone: '+91 98567 01234',
        status: StudentAttendanceState.absent,
        note: 'Unexcused Absence • SMS dispatched',
      ),
      const StudentAttendanceDetail(
        id: '11a2',
        name: 'Natasha Fernandez',
        rollNumber: '520',
        admissionNumber: 'ADM-2024-120',
        parentPhone: '+91 98678 01235',
        status: StudentAttendanceState.onLeave,
        note: 'National Science Olympiad Prep Leave (Approved by Anita Roy)',
      ),
      const StudentAttendanceDetail(
        id: '11a3',
        name: 'Gaurav Gill',
        rollNumber: '501',
        admissionNumber: 'ADM-2024-101',
        parentPhone: '+91 98789 01236',
        status: StudentAttendanceState.present,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'School Present',
                  value: '94.2%',
                  subtitle: '1,175 Students',
                  iconName: 'attendance',
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Unexcused Absent',
                  value: '48',
                  subtitle: 'SMS Alerts Dispatched',
                  iconName: 'calendar',
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Class-wise Attendance Rates',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Tap class for student list',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          _ClassAttendanceCard(
            className: 'Class 10 - Section A',
            teacherName: 'Rajesh Sharma',
            percentage: 95.2,
            present: 37,
            absent: 2,
            onLeave: 1,
            total: 40,
            onTap: () => ClassAttendanceDetailSheet.show(
              context,
              className: 'Class 10 - Section A',
              teacherName: 'Rajesh Sharma',
              students: _getClass10AStudents(),
            ),
          ),
          const SizedBox(height: 8),
          _ClassAttendanceCard(
            className: 'Class 10 - Section B',
            teacherName: 'Sunita Patel',
            percentage: 92.5,
            present: 37,
            absent: 2,
            onLeave: 1,
            total: 40,
            onTap: () => ClassAttendanceDetailSheet.show(
              context,
              className: 'Class 10 - Section B',
              teacherName: 'Sunita Patel',
              students: _getClass10BStudents(),
            ),
          ),
          const SizedBox(height: 8),
          _ClassAttendanceCard(
            className: 'Class 9 - Section A',
            teacherName: 'Vikram Rao',
            percentage: 97.5,
            present: 39,
            absent: 1,
            onLeave: 0,
            total: 40,
            onTap: () => ClassAttendanceDetailSheet.show(
              context,
              className: 'Class 9 - Section A',
              teacherName: 'Vikram Rao',
              students: _getClass9AStudents(),
            ),
          ),
          const SizedBox(height: 8),
          _ClassAttendanceCard(
            className: 'Class 9 - Section B',
            teacherName: 'Manisha Kapoor',
            percentage: 89.0,
            present: 33,
            absent: 3,
            onLeave: 1,
            total: 37,
            onTap: () => ClassAttendanceDetailSheet.show(
              context,
              className: 'Class 9 - Section B',
              teacherName: 'Manisha Kapoor',
              students: _getClass9BStudents(),
            ),
          ),
          const SizedBox(height: 8),
          _ClassAttendanceCard(
            className: 'Class 11 - Section A',
            teacherName: 'Dr. Arvind Swamy',
            percentage: 96.0,
            present: 48,
            absent: 1,
            onLeave: 1,
            total: 50,
            onTap: () => ClassAttendanceDetailSheet.show(
              context,
              className: 'Class 11 - Section A',
              teacherName: 'Dr. Arvind Swamy',
              students: _getClass11AStudents(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClassAttendanceCard extends StatelessWidget {
  final String className;
  final String teacherName;
  final double percentage;
  final int present;
  final int absent;
  final int onLeave;
  final int total;
  final VoidCallback onTap;

  const _ClassAttendanceCard({
    required this.className,
    required this.teacherName,
    required this.percentage,
    required this.present,
    required this.absent,
    required this.onLeave,
    required this.total,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const AppSvgIcon('teacher', size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        className,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.chevron_right, size: 16, color: AppColors.textMuted),
                    ],
                  ),
                  Text(
                    '$percentage%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: percentage >= 90 ? AppColors.success : AppColors.warning,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: percentage / 100,
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    percentage >= 90 ? AppColors.success : AppColors.warning,
                  ),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$present Present',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.success),
                  ),
                  Text(
                    '$absent Absent',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.danger),
                  ),
                  if (onLeave > 0)
                    Text(
                      '$onLeave On Leave',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.warning),
                    ),
                  Text(
                    'Total $total',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
