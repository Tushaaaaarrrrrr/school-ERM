import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:gi_campus/viewmodels/student_viewmodel.dart';
import 'package:gi_campus/views/parent_student/student_home_view.dart';

void main() {
  testWidgets('home shortcut labels select their matching screens',
      (tester) async {
    int? destination;
    await tester.pumpWidget(ChangeNotifierProvider(
      create: (_) => StudentViewModel(),
      child: MaterialApp(
          home: Scaffold(
              body: StudentHomeView(
                  onTabSelected: (index) => destination = index))),
    ));
    for (final entry in {
      'Report Cards': 3,
      'Fee Invoices': 4,
      'Bus Transport': 2,
      'Notices & Events': 8
    }.entries) {
      await tester.ensureVisible(find.text(entry.key));
      await tester.tap(find.text(entry.key));
      expect(destination, entry.value);
    }
  });
}
