import 'package:flutter/foundation.dart';
import '../data/models/student_model.dart';
import '../data/models/transport_model.dart';
import '../data/models/user_model.dart';
import '../data/services/api_client.dart';

/// Driver cockpit backed by the same /api/driver/roster and
/// /api/transport-events endpoints the web driver page uses.
class DriverViewModel extends ChangeNotifier {
  TransportRouteModel _route = TransportRouteModel.empty;
  final Set<String> _boardedStudents = {};
  List<StudentModel> _students = const [];
  Map<String, Map<String, dynamic>> _rawStudents = const {};
  Map<String, dynamic> _roster = const {};
  UserModel? _user;
  String? _error;

  TransportRouteModel get route => _route;
  Set<String> get boardedStudents => _boardedStudents;
  List<StudentModel> get students => _students;
  String? get error => _error;

  String stopNameFor(String studentId) =>
      (_rawStudents[studentId]?['stop'] as Map?)?['stop_name'] as String? ?? '';

  Future<void> loadFor(UserModel user, {bool force = false}) async {
    if (!force && _user?.id == user.id) return;
    _user = user;
    try {
      _roster = await ApiClient.getDriverRoster();
      final route = Map<String, dynamic>.from(_roster['route'] ?? const {});
      final vehicle = Map<String, dynamic>.from(_roster['vehicle'] ?? const {});
      final stops = (_roster['stops'] as List? ?? const [])
          .map((s) => Map<String, dynamic>.from(s as Map))
          .toList();
      final raw = (_roster['students'] as List? ?? const [])
          .map((s) => Map<String, dynamic>.from(s as Map))
          .toList();
      _rawStudents = {for (final s in raw) s['id'] as String: s};
      _students = raw.map(StudentModel.fromJson).toList();
      _route = TransportRouteModel(
        routeNumber: route['route_name'] as String? ?? 'No Route Assigned',
        vehicleNumber: vehicle['vehicle_number'] as String? ??
            vehicle['vehicle_name'] as String? ??
            'N/A',
        driverName: user.name,
        driverPhone: '',
        currentStatus: route.isEmpty ? 'Standby' : 'Active',
        stops: stops
            .map((s) => RouteStop(
                  name: s['stop_name'] as String? ?? '',
                  scheduledTime: s['estimated_pickup_time'] as String? ?? '',
                ))
            .toList(),
      );
      final events = await ApiClient.getTransportEvents();
      _boardedStudents
        ..clear()
        ..addAll(events
            .where((e) => e['event_type'] == 'picked_up')
            .map((e) => e['student_id'] as String));
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    notifyListeners();
  }

  Future<void> toggleBoarding(String studentId) async {
    final boarding = !_boardedStudents.contains(studentId);
    boarding
        ? _boardedStudents.add(studentId)
        : _boardedStudents.remove(studentId);
    notifyListeners();
    try {
      if (boarding) {
        final s = _rawStudents[studentId] ?? const {};
        final stop = Map<String, dynamic>.from(s['stop'] ?? const {});
        final asg = Map<String, dynamic>.from(s['assignment'] ?? const {});
        final route = Map<String, dynamic>.from(_roster['route'] ?? const {});
        final vehicle = Map<String, dynamic>.from(_roster['vehicle'] ?? const {});
        final enr = Map<String, dynamic>.from(s['current_enrollment'] ?? const {});
        final now = DateTime.now();
        await ApiClient.recordTransportEvent({
          'school_id': _user?.schoolId,
          'student_id': studentId,
          'student_name': '${s['first_name'] ?? ''} ${s['last_name'] ?? ''}'.trim(),
          'registration_number': s['registration_number'],
          'class_name': enr['class_name'],
          'section_name': enr['section_name'],
          'roll_number': enr['roll_number'],
          'transport_assignment_id': asg['id'],
          'vehicle_id': vehicle['id'],
          'vehicle_name': vehicle['vehicle_name'],
          'route_id': route['id'],
          'route_name': route['route_name'],
          'stop_id': stop['id'],
          'stop_name': stop['stop_name'],
          'event_type': 'picked_up',
          'event_date': now.toIso8601String().split('T').first,
          'event_time':
              '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
          'recorded_by': _user?.id,
          'recorded_by_name': _user?.name,
        });
      } else {
        await ApiClient.deleteTransportEvent(
            studentId: studentId, eventType: 'picked_up');
      }
    } catch (e) {
      // Roll back so the UI never shows a boarding the server did not store.
      boarding
          ? _boardedStudents.remove(studentId)
          : _boardedStudents.add(studentId);
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    }
  }
}
