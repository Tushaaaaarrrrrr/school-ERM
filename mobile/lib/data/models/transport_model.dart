class RouteStop {
  final String name;
  final String scheduledTime;
  final bool isPassed;
  final bool isCurrent;

  const RouteStop({
    required this.name,
    required this.scheduledTime,
    this.isPassed = false,
    this.isCurrent = false,
  });
}

class TransportRouteModel {
  final String routeNumber;
  final String vehicleNumber;
  final String driverName;
  final String driverPhone;
  final String currentStatus;
  final List<RouteStop> stops;

  const TransportRouteModel({
    required this.routeNumber,
    required this.vehicleNumber,
    required this.driverName,
    required this.driverPhone,
    required this.currentStatus,
    required this.stops,
  });

  static const empty = TransportRouteModel(
    routeNumber: 'No Route Assigned',
    vehicleNumber: 'N/A',
    driverName: 'Not Assigned',
    driverPhone: '',
    currentStatus: 'Standby',
    stops: [],
  );
}
