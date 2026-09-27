import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/mock_data.dart';
import 'student_detail_sheet.dart';

class AdminStudentsView extends StatefulWidget {
  const AdminStudentsView({super.key});

  @override
  State<AdminStudentsView> createState() => _AdminStudentsViewState();
}

class _AdminStudentsViewState extends State<AdminStudentsView> {
  String _searchQuery = '';
  String _selectedClass = 'All Classes';

  @override
  Widget build(BuildContext context) {
    final allStudents = MockData.studentsClass10A;
    final filtered = allStudents.where((s) {
      final matchesSearch = s.fullName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.admissionNumber.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesSearch;
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search & Filter Bar
          TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            decoration: InputDecoration(
              hintText: 'Search by student name or admission #...',
              prefixIcon: const Padding(
                padding: EdgeInsets.all(12.0),
                child: AppSvgIcon('graduation_cap', size: 18, color: AppColors.textMuted),
              ),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All Classes', 'Class 10-A', 'Class 9-B', 'Class 11-A', 'Class 8-C'].map((cls) {
                final isSelected = _selectedClass == cls;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(cls, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                    selected: isSelected,
                    selectedColor: AppColors.primaryLight,
                    onSelected: (val) {
                      if (val) setState(() => _selectedClass = cls);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Showing ${filtered.length} Students',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Tap student for 360° profile',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Student Roster
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final student = filtered[index];
              return Card(
                child: InkWell(
                  onTap: () => StudentDetailSheet.show(context, student: student),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.primaryLight,
                          child: Text(
                            student.rollNumber,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                student.fullName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              Text(
                                '${student.className} • Adm: ${student.admissionNumber}',
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        const StatusBadge(label: 'Enrolled', type: StatusType.success),
                        const SizedBox(width: 6),
                        const Icon(Icons.chevron_right, size: 18, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
