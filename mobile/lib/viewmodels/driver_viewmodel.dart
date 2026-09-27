import 'package:flutter/foundation.dart';
import '../data/models/transport_model.dart';
import '../data/services/mock_data.dart';

class DriverViewModel extends ChangeNotifier {
  final TransportRouteModel _route = MockData.sampleRoute;
  final Set<String> _boardedStudents = {'stu_1', 'stu_2'};

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
