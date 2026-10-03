import 'dart:async';
import 'package:flutter/material.dart';
import '../../data/services/api_client.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

class SchoolStatusCard extends StatefulWidget {
  const SchoolStatusCard({super.key});
  @override
  State<SchoolStatusCard> createState() => _SchoolStatusCardState();
}

class _SchoolStatusCardState extends State<SchoolStatusCard> {
  late Future<Map<String, dynamic>> _status;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _status = ApiClient.getSchoolStatus();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) => _refresh());
  }

  void _refresh() {
    if (mounted) setState(() => _status = ApiClient.getSchoolStatus());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<Map<String, dynamic>>(
        future: _status,
        builder: (context, snapshot) {
          final data = snapshot.data;
          final isOpen = data?['status'] == 'open';
          final iconBg =
              isOpen ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB);
          final iconColor =
              isOpen ? const Color(0xFF065F46) : const Color(0xFF92400E);
          final borderColor =
              isOpen ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A);

          return Card(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              onTap: data == null
                  ? _refresh
                  : () => showDialog<void>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: Text(data['title'].toString()),
                          content: Text(
                              '${data['subtitle']}\n\nSchool time: ${data['currentTimeStr']}'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Close'),
                            ),
                          ],
                        ),
                      ),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: iconBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor, width: 1),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.school_rounded,
                        color: iconColor,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  data?['badgeLabel']?.toString() ??
                                      (snapshot.hasError
                                          ? 'Status unavailable'
                                          : 'Checking status…'),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: AppColors.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (data != null) ...[
                                const SizedBox(width: 8),
                                StatusBadge(
                                  label: isOpen ? 'OPEN' : 'SCHEDULE',
                                  type: isOpen
                                      ? StatusType.success
                                      : StatusType.warning,
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            data == null
                                ? (snapshot.hasError
                                    ? snapshot.error
                                        .toString()
                                        .replaceFirst('Exception: ', '')
                                    : 'Syncing school timetable')
                                : '${data['dayLabel']} • ${data['formattedTodayHours']}',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w400,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, size: 20),
                      color: AppColors.textSecondary,
                      tooltip: 'Refresh school status',
                      constraints:
                          const BoxConstraints(minWidth: 48, minHeight: 48),
                      onPressed: _refresh,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      );
}
