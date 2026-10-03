// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:gi_campus/data/services/auth_service.dart';
import 'package:gi_campus/viewmodels/student_viewmodel.dart';
import 'package:gi_campus/viewmodels/driver_viewmodel.dart';

import 'package:gi_campus/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthService()),
          ChangeNotifierProvider(create: (_) => StudentViewModel()),
          ChangeNotifierProvider(create: (_) => DriverViewModel()),
        ],
        child: const SchoolErpApp(),
      ),
    );
    await tester.pump(const Duration(milliseconds: 2000));
    await tester.pumpAndSettle();
    expect(find.byType(SchoolErpApp), findsOneWidget);
  });
}
