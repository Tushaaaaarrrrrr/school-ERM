import 'dart:async';
import 'package:flutter/material.dart';
import '../../data/services/api_client.dart';

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
          return Card(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: ListTile(
              leading: Icon(Icons.school,
                  color:
                      data?['status'] == 'open' ? Colors.green : Colors.orange),
              title: Text(data?['badgeLabel']?.toString() ??
                  (snapshot.hasError
                      ? 'School status unavailable'
                      : 'Loading school status…')),
              subtitle: Text(data == null
                  ? (snapshot.hasError
                      ? snapshot.error
                          .toString()
                          .replaceFirst('Exception: ', '')
                      : 'Checking school schedule')
                  : '${data['dayLabel']} • ${data['formattedTodayHours']}'),
              trailing: IconButton(
                  icon: const Icon(Icons.refresh),
                  tooltip: 'Refresh school status',
                  onPressed: _refresh),
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
                                  child: const Text('Close'))
                            ],
                          )),
            ),
          );
        },
      );
}
