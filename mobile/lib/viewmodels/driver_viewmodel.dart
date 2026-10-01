import 'package:flutter/foundation.dart';
import '../data/models/transport_model.dart';

class DriverViewModel extends ChangeNotifier {
  final TransportRouteModel _route = TransportRouteModel.empty;
  final Set<String> _boardedStudents = {};

  TransportRouteModel get route => _route;
  Set<String> get boardedStudents => _boardedStudents;

  void toggleBoarding(String studentId) {
    if (_boardedStudents.contains(studentId)) {
      _boardedStudents.remove(studentId);
    } else {
      _boardedStudents.add(studentId);
    }
    notifyListeners();
  }
}
