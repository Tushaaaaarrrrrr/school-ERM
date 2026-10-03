import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';

class TeacherLeaveView extends StatefulWidget {
  const TeacherLeaveView({super.key});

  @override
  State<TeacherLeaveView> createState() => _TeacherLeaveViewState();
}

class _TeacherLeaveViewState extends State<TeacherLeaveView> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _leaves = [];

  @override
  void initState() {
    super.initState();
    _loadLeaves();
  }

  Future<void> _loadLeaves() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final list = await ApiClient.getList('/api/leaves/teachers');
      if (!mounted) return;
      setState(() {
        _leaves = list;
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

  void _openRequestLeaveSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (ctx) => _RequestLeaveSheet(onSubmitted: _loadLeaves),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);

    final total = _leaves.length;
    final approvedCount = _leaves.where((l) => l['status'] == 'approved').length;
    final pendingCount = _leaves.where((l) => l['status'] == 'pending').length;
    final rejectedCount = _leaves.where((l) => l['status'] == 'rejected').length;

    final activeLeave = _leaves.firstWhere(
      (l) {
        final start = l['start_date']?.toString() ?? '';
        final end = l['end_date']?.toString() ?? '';
        final status = l['status']?.toString() ?? '';
        return status == 'approved' && start.compareTo(todayStr) <= 0 && end.compareTo(todayStr) >= 0;
      },
      orElse: () => <String, dynamic>{},
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openRequestLeaveSheet,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Request Leave', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadLeaves,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'My Leaves & Attendance',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'View leave history, submit requests, and check approval status.',
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
                          onPressed: _loadLeaves,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.lg),

              // Active Leave Alert Banner (if applicable)
              if (activeLeave.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppColors.success, size: 22),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Approved leave is currently active',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppColors.success,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Return joining date: ${activeLeave['return_date'] ?? 'N/A'}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
              ],

              // Summary Stats Row
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Total Requests',
                      value: '$total',
                      subtitle: 'Submitted leaves',
                      iconName: 'calendar',
                      iconColor: AppColors.primary,
                      iconBgColor: AppColors.primaryLight,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: StatCard(
                      title: 'Pending',
                      value: '$pendingCount',
                      subtitle: 'Under review',
                      iconName: 'attendance',
                      iconColor: AppColors.warning,
                      iconBgColor: AppColors.warningLight,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Approved',
                      value: '$approvedCount',
                      subtitle: 'Granted by admin',
                      iconName: 'award',
                      iconColor: AppColors.success,
                      iconBgColor: AppColors.successLight,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: StatCard(
                      title: 'Rejected',
                      value: '$rejectedCount',
                      subtitle: 'Declined requests',
                      iconName: 'attendance',
                      iconColor: AppColors.danger,
                      iconBgColor: AppColors.dangerLight,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.xl),

              // Leave History Section
              const Text(
                'Leave History',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              if (_leaves.isEmpty && !_loading)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.event_note,
                              size: 40, color: AppColors.textMuted),
                          SizedBox(height: AppSpacing.sm),
                          Text(
                            'No leave requests found. Tap "Request Leave" to apply.',
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
                ..._leaves.map((leave) => _buildLeaveCard(leave)),

              const SizedBox(height: 80), // Padding for FAB
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLeaveCard(Map<String, dynamic> leave) {
    final status = (leave['status'] ?? 'pending').toString().toLowerCase();
    final leaveType = (leave['leave_type'] ?? 'full_day').toString();
    final start = leave['start_date']?.toString() ?? '';
    final end = leave['end_date']?.toString() ?? '';
    final returnDate = leave['return_date']?.toString() ?? '';
    final reason = leave['reason']?.toString() ?? '';
    final adminNotes = leave['admin_notes']?.toString();

    BadgeType badgeType;
    String statusLabel = status.toUpperCase();
    if (status == 'approved') {
      badgeType = BadgeType.success;
    } else if (status == 'rejected') {
      badgeType = BadgeType.danger;
    } else {
      badgeType = BadgeType.warning;
    }

    final startParsed = DateTime.tryParse(start);
    final endParsed = DateTime.tryParse(end);
    final dateDisplay = (startParsed != null && endParsed != null)
        ? (start == end
            ? AppFormatters.date(startParsed)
            : '${AppFormatters.date(startParsed)} – ${AppFormatters.date(endParsed)}')
        : '$start – $end';

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  dateDisplay,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
                StatusBadge(label: statusLabel, type: badgeType),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    leaveType == 'partial_day' ? 'Partial Day' : 'Full Day',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ),
                if (returnDate.isNotEmpty) ...[
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'Return: $returnDate',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
            if (reason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Reason: $reason',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
            if (adminNotes != null && adminNotes.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  'Admin Note: $adminNotes',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RequestLeaveSheet extends StatefulWidget {
  final VoidCallback onSubmitted;

  const _RequestLeaveSheet({required this.onSubmitted});

  @override
  State<_RequestLeaveSheet> createState() => _RequestLeaveSheetState();
}

class _RequestLeaveSheetState extends State<_RequestLeaveSheet> {
  final _reasonController = TextEditingController();
  String _leaveType = 'full_day';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  DateTime _returnDate = DateTime.now().add(const Duration(days: 1));
  bool _submitting = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a reason for the leave.')),
      );
      return;
    }

    if (_endDate.isBefore(_startDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End date cannot be earlier than start date.')),
      );
      return;
    }

    if (!_returnDate.isAfter(_endDate)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Return date must be after the end date.')),
      );
      return;
    }

    final user = context.read<AuthService>().currentUser;
    setState(() => _submitting = true);

    try {
      final df = DateFormat('yyyy-MM-dd');
      await ApiClient.send('POST', '/api/leaves/teachers', {
        'school_id': user.schoolId,
        'leave_type': _leaveType,
        'start_date': df.format(_startDate),
        'end_date': df.format(_endDate),
        'return_date': df.format(_returnDate),
        'reason': reason,
      });

      if (!mounted) return;
      Navigator.pop(context);
      widget.onSubmitted();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Leave request submitted successfully.'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
        if (_endDate.isBefore(picked)) _endDate = picked;
        if (!_returnDate.isAfter(_endDate)) {
          _returnDate = _endDate.add(const Duration(days: 1));
        }
      });
    }
  }

  Future<void> _pickEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate.isBefore(_startDate) ? _startDate : _endDate,
      firstDate: _startDate,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _endDate = picked;
        if (!_returnDate.isAfter(picked)) {
          _returnDate = picked.add(const Duration(days: 1));
        }
      });
    }
  }

  Future<void> _pickReturnDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _returnDate.isAfter(_endDate) ? _returnDate : _endDate.add(const Duration(days: 1)),
      firstDate: _endDate.add(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _returnDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd MMM yyyy');

    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Request Leave',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Leave Type
          const Text('Leave Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: const Center(child: Text('Full Day')),
                  selected: _leaveType == 'full_day',
                  onSelected: (val) {
                    if (val) setState(() => _leaveType = 'full_day');
                  },
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: ChoiceChip(
                  label: const Center(child: Text('Partial Day')),
                  selected: _leaveType == 'partial_day',
                  onSelected: (val) {
                    if (val) setState(() => _leaveType = 'partial_day');
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Dates selection
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: _pickStartDate,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Start Date',
                      prefixIcon: Icon(Icons.calendar_today, size: 16),
                    ),
                    child: Text(df.format(_startDate), style: const TextStyle(fontSize: 13)),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: InkWell(
                  onTap: _pickEndDate,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'End Date',
                      prefixIcon: Icon(Icons.calendar_today, size: 16),
                    ),
                    child: Text(df.format(_endDate), style: const TextStyle(fontSize: 13)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          InkWell(
            onTap: _pickReturnDate,
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Return Joining Date',
                prefixIcon: Icon(Icons.login, size: 16),
              ),
              child: Text(df.format(_returnDate), style: const TextStyle(fontSize: 13)),
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // Reason input
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Reason for Leave',
              hintText: 'e.g. Medical appointment, family emergency...',
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Submit Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? 'Submitting...' : 'Submit Leave Request'),
            ),
          ),
        ],
      ),
    );
  }
}
