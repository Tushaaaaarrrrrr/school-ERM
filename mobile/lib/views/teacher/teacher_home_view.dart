import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';

class TeacherHomeView extends StatefulWidget {
  final void Function(int index)? onTabSelected;

  const TeacherHomeView({super.key, this.onTabSelected});

  @override
  State<TeacherHomeView> createState() => _TeacherHomeViewState();
}

class _TeacherHomeViewState extends State<TeacherHomeView> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _assignments = [];
  List<Map<String, dynamic>> _todayTimetable = [];
  List<Map<String, dynamic>> _leaves = [];
  List<Map<String, dynamic>> _notices = [];

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final now = DateTime.now();
      final dayOfWeek = now.weekday == 7 ? 1 : now.weekday;

      final results = await Future.wait([
        ApiClient.getList('/api/teacher-assignments')
            .catchError((_) => <Map<String, dynamic>>[]),
        ApiClient.getList('/api/timetable', {'dayOfWeek': '$dayOfWeek'})
            .catchError((_) => <Map<String, dynamic>>[]),
        ApiClient.getList('/api/leaves/teachers')
            .catchError((_) => <Map<String, dynamic>>[]),
        ApiClient.getList('/api/notices')
            .catchError((_) => <Map<String, dynamic>>[]),
      ]);

      if (!mounted) return;
      setState(() {
        _assignments = results[0];
        _todayTimetable = results[1];
        _leaves = results[2];
        _notices = results[3];
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

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().currentUser;
    final pendingLeaves =
        _leaves.where((l) => (l['status'] ?? '').toString() == 'pending').length;

    return RefreshIndicator(
      onRefresh: _loadDashboard,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header Card
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(AppRadius.lg),
                boxShadow: AppShadows.soft,
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    child: const AppSvgIcon('teacher',
                        size: 28, color: Colors.white),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome, ${user.name.isNotEmpty ? user.name : 'Teacher'}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.schoolName.isNotEmpty
                              ? user.schoolName
                              : 'Faculty Portal',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const StatusBadge(
                    label: 'FACULTY',
                    type: BadgeType.info,
                  ),
                ],
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
                        onPressed: _loadDashboard,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.lg),

            // Stat Cards Grid
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    title: 'Assigned Classes',
                    value: '${_assignments.length}',
                    subtitle: 'Active subjects',
                    iconName: 'graduation_cap',
                    iconColor: AppColors.primary,
                    iconBgColor: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: StatCard(
                    title: "Today's Classes",
                    value: '${_todayTimetable.length}',
                    subtitle: 'Scheduled periods',
                    iconName: 'calendar',
                    iconColor: AppColors.info,
                    iconBgColor: AppColors.infoLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    title: 'Pending Leaves',
                    value: '$pendingLeaves',
                    subtitle: 'Awaiting approval',
                    iconName: 'attendance',
                    iconColor: AppColors.warning,
                    iconBgColor: AppColors.warningLight,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: StatCard(
                    title: 'Notices',
                    value: '${_notices.length}',
                    subtitle: 'Announcements',
                    iconName: 'bell',
                    iconColor: AppColors.success,
                    iconBgColor: AppColors.successLight,
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.xl),

            // Quick Actions Section
            const Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            GridView.count(
              crossAxisCount: 3,
              crossAxisSpacing: AppSpacing.sm,
              mainAxisSpacing: AppSpacing.sm,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildActionItem(
                  icon: Icons.fact_check_outlined,
                  color: AppColors.primary,
                  label: 'Attendance',
                  tabIndex: 1,
                ),
                _buildActionItem(
                  icon: Icons.event_busy_outlined,
                  color: AppColors.warning,
                  label: 'Leaves',
                  tabIndex: 2,
                ),
                _buildActionItem(
                  icon: Icons.school_outlined,
                  color: AppColors.info,
                  label: 'My Classes',
                  tabIndex: 3,
                ),
                _buildActionItem(
                  icon: Icons.assignment_outlined,
                  color: AppColors.success,
                  label: 'Exams & Marks',
                  tabIndex: 4,
                ),
                _buildActionItem(
                  icon: Icons.schedule_outlined,
                  color: const Color(0xFF8B5CF6),
                  label: 'Timetable',
                  tabIndex: 5,
                ),
                _buildActionItem(
                  icon: Icons.payments_outlined,
                  color: const Color(0xFF0EA5E9),
                  label: 'Salary Slip',
                  tabIndex: 6,
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.xl),

            // Today's Schedule Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Today's Schedule",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (_todayTimetable.isNotEmpty)
                  TextButton(
                    onPressed: () => widget.onTabSelected?.call(5),
                    child: const Text('View Full Week'),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            if (_todayTimetable.isEmpty && !_loading)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.event_available,
                            size: 40, color: AppColors.textMuted),
                        SizedBox(height: AppSpacing.sm),
                        Text(
                          'No teaching periods scheduled for today',
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
              ..._todayTimetable.map((period) => _buildScheduleCard(period)),

            const SizedBox(height: AppSpacing.xl),

            // Recent Notices Section
            const Text(
              'Recent Notices',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            if (_notices.isEmpty && !_loading)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.campaign_outlined,
                            size: 40, color: AppColors.textMuted),
                        SizedBox(height: AppSpacing.sm),
                        Text(
                          'No recent notices posted',
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
              ..._notices.take(3).map((notice) => _buildNoticeCard(notice)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionItem({
    required IconData icon,
    required Color color,
    required String label,
    required int tabIndex,
  }) {
    return InkWell(
      onTap: () => widget.onTabSelected?.call(tabIndex),
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScheduleCard(Map<String, dynamic> period) {
    final start = period['start_time'] ?? '';
    final end = period['end_time'] ?? '';
    final subject = period['subject_name'] ?? period['subject'] ?? 'Subject';
    final className = period['class_name'] ?? 'Class';
    final section = period['section_name'] ?? '';
    final room = period['room'] ?? period['room_number'] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          alignment: Alignment.center,
          child: const Icon(Icons.school, color: AppColors.primary, size: 22),
        ),
        title: Text(
          subject.toString(),
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: AppColors.textPrimary,
          ),
        ),
        subtitle: Text(
          '$className${section.isNotEmpty ? ' - $section' : ''}${room.isNotEmpty ? ' • Room $room' : ''}',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            border: Border.all(color: AppColors.border),
          ),
          child: Text(
            start.isNotEmpty && end.isNotEmpty ? '$start - $end' : 'Period',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNoticeCard(Map<String, dynamic> notice) {
    final title = notice['title'] ?? 'Notice';
    final content = notice['content'] ?? '';
    final date = notice['publish_date'] ?? notice['created_at'] ?? '';
    final dateStr = date.isNotEmpty ? date.toString().split('T').first : '';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title.toString(),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                if (dateStr.isNotEmpty)
                  Text(
                    dateStr,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
            if (content.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                content.toString(),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
