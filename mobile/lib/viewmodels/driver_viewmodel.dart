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
  final Map<String, String> _studentStatus = {};
  List<StudentModel> _students = const [];
  Map<String, Map<String, dynamic>> _rawStudents = const {};
  Map<String, dynamic> _roster = const {};
  UserModel? _user;
  String? _error;
  int _currentStopIndex = 0;

  TransportRouteModel get route => _route;
  Set<String> get boardedStudents => _boardedStudents;
  List<StudentModel> get students => _students;
  String? get error => _error;
  int get currentStopIndex => _currentStopIndex;

  String stopNameFor(String studentId) =>
      (_rawStudents[studentId]?['stop'] as Map?)?['stop_name'] as String? ?? '';

  String statusFor(String studentId) => _studentStatus[studentId] ?? 'pending';

  Set<String> get notRidingStudents =>
      _studentStatus.entries.where((e) => e.value == 'not_riding').map((e) => e.key).toSet();

  Set<String> get droppedOffStudents =>
      _studentStatus.entries.where((e) => e.value == 'dropped_off').map((e) => e.key).toSet();

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void setCurrentStopIndex(int index) {
    if (_route.stops.isEmpty) return;
    _currentStopIndex = index.clamp(0, _route.stops.length - 1);
    _updateRouteStopsState();
    notifyListeners();
  }

  void markStopPassed(int index) {
    if (index < _route.stops.length - 1) {
      setCurrentStopIndex(index + 1);
    } else {
      _currentStopIndex = _route.stops.length;
      _updateRouteStopsState();
      notifyListeners();
    }
  }

  void _updateRouteStopsState() {
    final updatedStops = _route.stops.asMap().entries.map((entry) {
      final i = entry.key;
      final s = entry.value;
      return RouteStop(
        name: s.name,
        scheduledTime: s.scheduledTime,
        isPassed: i < _currentStopIndex,
        isCurrent: i == _currentStopIndex,
      );
    }).toList();

    _route = TransportRouteModel(
      routeNumber: _route.routeNumber,
      vehicleNumber: _route.vehicleNumber,
      driverName: _route.driverName,
      driverPhone: _route.driverPhone,
      currentStatus: _route.currentStatus,
      stops: updatedStops,
    );
  }

  Future<void> refresh() async {
    if (_user != null) {
      await loadFor(_user!, force: true);
    }
  }

  Future<void> loadFor(UserModel user, {bool force = false}) async {
    if (!force && _user?.id == user.id) return;
    _user = user;
    try {
      _roster = await ApiClient.getDriverRoster();
      final routeData = Map<String, dynamic>.from(_roster['route'] ?? const {});
      final vehicle = Map<String, dynamic>.from(_roster['vehicle'] ?? const {});
      final stops = (_roster['stops'] as List? ?? const [])
          .map((s) => Map<String, dynamic>.from(s as Map))
          .toList();
      final raw = (_roster['students'] as List? ?? const [])
          .map((s) => Map<String, dynamic>.from(s as Map))
          .toList();
      _rawStudents = {for (final s in raw) s['id'] as String: s};
      _students = raw.map(StudentModel.fromJson).toList();

      final routeStops = stops.asMap().entries.map((entry) {
        final i = entry.key;
        final s = entry.value;
        return RouteStop(
          name: s['stop_name'] as String? ?? '',
          scheduledTime: s['estimated_pickup_time'] as String? ?? '',
          isPassed: i < _currentStopIndex,
          isCurrent: i == _currentStopIndex,
        );
      }).toList();

      _route = TransportRouteModel(
        routeNumber: routeData['route_name'] as String? ?? 'No Route Assigned',
        vehicleNumber: vehicle['vehicle_number'] as String? ??
            vehicle['vehicle_name'] as String? ??
            'N/A',
        driverName: user.name,
        driverPhone: '',
        currentStatus: routeData.isEmpty ? 'Standby' : 'Active',
        stops: routeStops,
      );

      final events = await ApiClient.getTransportEvents();
      _studentStatus.clear();
      for (final s in raw) {
        final sId = s['id'] as String;
        _studentStatus[sId] = 'pending';
      }
      for (final e in events) {
        final sId = e['student_id'] as String?;
        final type = e['event_type'] as String?;
        if (sId != null && type != null && _studentStatus.containsKey(sId)) {
          _studentStatus[sId] = type;
        }
      }

      _boardedStudents
        ..clear()
        ..addAll(_studentStatus.entries
            .where((e) => e.value == 'picked_up' || e.value == 'dropped_off')
            .map((e) => e.key));
      _error = null;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }
    notifyListeners();
  }

  Future<void> toggleBoarding(String studentId) async {
    final current = statusFor(studentId);
    final next = current == 'picked_up' ? 'pending' : 'picked_up';
    await setStudentStatus(studentId, next);
  }

  Future<void> setStudentStatus(String studentId, String status) async {
    final previousStatus = _studentStatus[studentId] ?? 'pending';
    if (previousStatus == status) return;

    _studentStatus[studentId] = status;
    if (status == 'picked_up' || status == 'dropped_off') {
      _boardedStudents.add(studentId);
    } else {
      _boardedStudents.remove(studentId);
    }
    notifyListeners();

    try {
      if (status != 'pending') {
        final s = _rawStudents[studentId] ?? const {};
        final stop = Map<String, dynamic>.from(s['stop'] ?? const {});
        final asg = Map<String, dynamic>.from(s['assignment'] ?? const {});
        final routeData = Map<String, dynamic>.from(_roster['route'] ?? const {});
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
          'route_id': routeData['id'],
          'route_name': routeData['route_name'],
          'stop_id': stop['id'],
          'stop_name': stop['stop_name'],
          'event_type': status,
          'event_date': now.toIso8601String().split('T').first,
          'event_time':
              '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
          'recorded_by': _user?.id,
          'recorded_by_name': _user?.name,
        });
      } else {
        await ApiClient.deleteTransportEvent(
          studentId: studentId,
          eventType: previousStatus != 'pending' ? previousStatus : null,
        );
      }
    } catch (e) {
      // Revert on error
      _studentStatus[studentId] = previousStatus;
      if (previousStatus == 'picked_up' || previousStatus == 'dropped_off') {
        _boardedStudents.add(studentId);
      } else {
        _boardedStudents.remove(studentId);
      }
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    }
  }
}
