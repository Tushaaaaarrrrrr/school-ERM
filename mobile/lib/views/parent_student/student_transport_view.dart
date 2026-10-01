import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentTransportView extends StatelessWidget {
  const StudentTransportView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<StudentViewModel>();
    final assignment = vm.transportAssignments.isNotEmpty
        ? vm.transportAssignments.first
        : null;
    final routeId = assignment?['route_id'];
    Map<String, dynamic>? route;
    for (final item in vm.transportRoutes) {
      if ('${item['id']}' == '$routeId') route = item;
    }
    final stops = vm.transportStops;
    final events = vm.transportEvents;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('School Transport',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (assignment == null)
            const _EmptyCard(
                'No transport assignment returned by the school yet.')
          else ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: const AppSvgIcon('bus',
                          size: 24, color: AppColors.primary),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${route?['route_name'] ?? route?['route_number'] ?? assignment['route_name'] ?? 'Assigned Route'}',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          if ('${assignment['stop_name'] ?? ''}'.isNotEmpty)
                            Text('Stop: ${assignment['stop_name']}',
                                style: const TextStyle(
                                    color: AppColors.textSecondary)),
                          if ('${assignment['vehicle_number'] ?? route?['vehicle_number'] ?? ''}'
                              .isNotEmpty)
                            Text(
                                'Vehicle: ${assignment['vehicle_number'] ?? route?['vehicle_number']}',
                                style: const TextStyle(
                                    color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Today Status',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (events.isEmpty)
              const _EmptyCard('No pickup/drop event returned for today.')
            else
              ...events.map((event) => Card(
                    child: ListTile(
                      title: Text(
                          '${event['event_type'] ?? event['status'] ?? 'Transport event'}'),
                      subtitle: Text(
                          '${event['event_time'] ?? event['created_at'] ?? ''}'),
                    ),
                  )),
            const SizedBox(height: 16),
            const Text('Route Stops',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (stops.isEmpty)
              const _EmptyCard('No route stops returned by the school yet.')
            else
              ...stops.map((stop) => Card(
                    child: ListTile(
                      leading: const AppSvgIcon('map_pin',
                          size: 18, color: AppColors.primary),
                      title: Text(
                          '${stop['name'] ?? stop['stop_name'] ?? 'Stop'}'),
                      subtitle: Text(
                          '${stop['scheduled_time'] ?? stop['pickup_time'] ?? ''}'),
                    ),
                  )),
          ],
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final String message;

  const _EmptyCard(this.message);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Text(message,
            style: const TextStyle(color: AppColors.textSecondary)),
      ),
    );
  }
}
