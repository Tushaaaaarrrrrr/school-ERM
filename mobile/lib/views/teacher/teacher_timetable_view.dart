import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/widgets/stat_card.dart';
import '../../data/services/api_client.dart';

class TeacherTimetableView extends StatefulWidget {
  const TeacherTimetableView({super.key});

  @override
  State<TeacherTimetableView> createState() => _TeacherTimetableViewState();
}

class _DayTab {
  final int dayNumber; // 1 = Monday ... 6 = Saturday
  final String name;
  final String shortName;

  const _DayTab(this.dayNumber, this.name, this.shortName);
}

const _kDays = [
  _DayTab(1, 'Monday', 'Mon'),
  _DayTab(2, 'Tuesday', 'Tue'),
  _DayTab(3, 'Wednesday', 'Wed'),
  _DayTab(4, 'Thursday', 'Thu'),
  _DayTab(5, 'Friday', 'Fri'),
  _DayTab(6, 'Saturday', 'Sat'),
];

class _TeacherTimetableViewState extends State<TeacherTimetableView> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _allEntries = [];
  // Filter: 'today' | 'all' | 1..6
  dynamic _selectedFilter = 'today';

  @override
  void initState() {
    super.initState();
    _loadTimetable();
  }

  int get _todayDayNumber {
    final d = DateTime.now().weekday;
    return d == 7 ? 1 : d; // If Sunday, default to Monday
  }

  Future<void> _loadTimetable() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final list = await ApiClient.getList('/api/timetable');
      if (!mounted) return;
      setState(() {
        _allEntries = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> _entriesForDay(int dayNum) {
    final matches = _allEntries.where((e) {
      final d = int.tryParse(e['day_of_week']?.toString() ?? '');
      return d == dayNum;
    }).toList();

    // Sort chronologically by start_time
    matches.sort((a, b) {
      final startA = (a['start_time'] ?? '').toString();
      final startB = (b['start_time'] ?? '').toString();
      return startA.compareTo(startB);
    });

    return matches;
  }

  @override
  Widget build(BuildContext context) {
    final todayCount = _entriesForDay(_todayDayNumber).length;
    final totalWeekly = _allEntries.length;

    return RefreshIndicator(
      onRefresh: _loadTimetable,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'My Teaching Schedule',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'View your weekly class timetable, assigned rooms, and timings.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),

            if (_loading) ...[
              const SizedBox(height: AppSpacing.lg),
              const LinearProgressIndicator(minHeight: 2),
            ],

            if (_error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Card(
                color: AppColors.dangerLight,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.danger, size: 20),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(
                              color: AppColors.danger, fontSize: 13),
                        ),
                      ),
                      TextButton(
                        onPressed: _loadTimetable,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.lg),

            // Stat Cards Row
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    title: "Today's Periods",
                    value: '$todayCount',
                    subtitle: 'Classes today',
                    iconName: 'calendar',
                    iconColor: AppColors.primary,
                    iconBgColor: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: StatCard(
                    title: 'Weekly Periods',
                    value: '$totalWeekly',
                    subtitle: 'Full week total',
                    iconName: 'attendance',
                    iconColor: AppColors.info,
                    iconBgColor: AppColors.infoLight,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.lg),

            // Day Filter Chips / Selector
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('today', "Today's Schedule"),
                  const SizedBox(width: AppSpacing.xs),
                  _buildFilterChip('all', 'Full Week'),
                  const SizedBox(width: AppSpacing.xs),
                  ..._kDays.map((d) => Padding(
                        padding: const EdgeInsets.only(right: AppSpacing.xs),
                        child: _buildFilterChip(d.dayNumber, d.shortName),
                      )),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Content depending on selected filter
            if (_selectedFilter == 'all')
              ..._kDays.map((day) {
                final dayEntries = _entriesForDay(day.dayNumber);
                return _buildDayGroupSection(day.name, dayEntries);
              })
            else ...[
              Builder(
                builder: (context) {
                  final targetDay = _selectedFilter == 'today'
                      ? _todayDayNumber
                      : _selectedFilter as int;
                  final dayName = _kDays.firstWhere((d) => d.dayNumber == targetDay).name;
                  final entries = _entriesForDay(targetDay);

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$dayName (${entries.length} Periods)',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      if (entries.isEmpty && !_loading)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(AppSpacing.xl),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.schedule,
                                      size: 40, color: AppColors.textMuted),
                                  SizedBox(height: AppSpacing.sm),
                                  Text(
                                    'No periods scheduled for this day.',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      else
                        ...entries.map((period) => _buildPeriodCard(period)),
                    ],
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(dynamic value, String label) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _selectedFilter = value);
      },
    );
  }

  Widget _buildDayGroupSection(String dayName, List<Map<String, dynamic>> entries) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                dayName,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${entries.length} Periods',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryDark,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (entries.isEmpty)
          const Padding(
            padding: EdgeInsets.only(bottom: AppSpacing.md),
            child: Card(
              child: Padding(
                padding: EdgeInsets.all(AppSpacing.md),
                child: Center(
                  child: Text(
                    'No periods scheduled.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ),
              ),
            ),
          )
        else
          ...entries.map((period) => _buildPeriodCard(period)),
        const SizedBox(height: AppSpacing.sm),
      ],
    );
  }

  Widget _buildPeriodCard(Map<String, dynamic> period) {
    final start = period['start_time'] ?? '';
    final end = period['end_time'] ?? '';
    final subject = period['subject_name'] ?? period['subject'] ?? 'General';
    final className = period['class_name'] ?? 'Class';
    final section = period['section_name'] ?? '';
    final room = period['room'] ?? period['room_number'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            // Time Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    start.isNotEmpty ? start.toString() : 'Period',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryDark,
                    ),
                  ),
                  if (end.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      end.toString(),
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            // Subject & Class Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject.toString(),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.school, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        '$className${section.isNotEmpty ? ' - $section' : ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (room.isNotEmpty) ...[
                        const SizedBox(width: AppSpacing.md),
                        const Icon(Icons.meeting_room, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          'Room $room',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
