import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gi_campus/data/services/auth_service.dart';
import 'package:gi_campus/views/teacher/teacher_attendance_view.dart';
import 'package:gi_campus/views/teacher/teacher_classes_view.dart';
import 'package:gi_campus/views/teacher/teacher_exams_view.dart';
import 'package:gi_campus/views/teacher/teacher_home_view.dart';
import 'package:gi_campus/views/teacher/teacher_leave_view.dart';
import 'package:gi_campus/views/teacher/teacher_payments_view.dart';
import 'package:gi_campus/views/teacher/teacher_timetable_view.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

Widget _buildTestApp(Widget child) {
  return ChangeNotifierProvider(
    create: (_) => AuthService(),
    child: MaterialApp(
      home: Scaffold(body: child),
    ),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Teacher Native Views Tests', () {
    testWidgets('TeacherHomeView renders dashboard and triggers navigation',
        (tester) async {
      int? tappedIndex;
      await tester.pumpWidget(
        _buildTestApp(
          TeacherHomeView(onTabSelected: (idx) => tappedIndex = idx),
        ),
      );
      await tester.pump();

      expect(find.text('Assigned Classes'), findsOneWidget);
      expect(find.text('Quick Actions'), findsOneWidget);
      expect(find.text("Today's Schedule"), findsOneWidget);
      expect(find.text('Recent Notices'), findsOneWidget);

      // Verify quick action shortcuts
      expect(find.text('Attendance'), findsOneWidget);
      expect(find.text('Leaves'), findsOneWidget);
      expect(find.text('My Classes'), findsOneWidget);
      expect(find.text('Exams & Marks'), findsOneWidget);
      expect(find.text('Timetable'), findsOneWidget);
      expect(find.text('Salary Slip'), findsOneWidget);

      // Tap an action
      await tester.tap(find.text('Attendance'));
      expect(tappedIndex, 1);

      await tester.tap(find.text('Leaves'));
      expect(tappedIndex, 2);
    });

    testWidgets('TeacherAttendanceView renders class options and actions',
        (tester) async {
      await tester.pumpWidget(_buildTestApp(const TeacherAttendanceView()));
      await tester.pump();

      expect(find.text('Change'), findsOneWidget);
      expect(find.text('All Present'), findsOneWidget);
      expect(find.text('All Absent'), findsOneWidget);
      expect(find.text('Save Attendance'), findsOneWidget);
    });

    testWidgets('TeacherLeaveView renders leave history and request button',
        (tester) async {
      await tester.pumpWidget(_buildTestApp(const TeacherLeaveView()));
      await tester.pump();

      expect(find.text('My Leaves & Attendance'), findsOneWidget);
      expect(find.text('Total Requests'), findsOneWidget);
      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('Approved'), findsOneWidget);
      expect(find.text('Rejected'), findsOneWidget);
      expect(find.text('Request Leave'), findsOneWidget);
    });

    testWidgets('TeacherClassesView renders assigned classes header and search',
        (tester) async {
      await tester.pumpWidget(_buildTestApp(const TeacherClassesView()));
      await tester.pump();

      expect(find.text('My Assigned Classes'), findsOneWidget);
      expect(find.text('Total Classes'), findsOneWidget);
      expect(find.text('Total Students'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('TeacherExamsView renders exams list and new exam button',
        (tester) async {
      await tester.pumpWidget(_buildTestApp(const TeacherExamsView()));
      await tester.pump();

      expect(find.text('Exams & Marks Entry'), findsOneWidget);
      expect(find.text('Total Exams'), findsOneWidget);
      expect(find.text('Draft / In Progress'), findsOneWidget);
      expect(find.text('New Exam'), findsOneWidget);
    });

    testWidgets('TeacherTimetableView renders days filter and schedule',
        (tester) async {
      await tester.pumpWidget(_buildTestApp(const TeacherTimetableView()));
      await tester.pump();

      expect(find.text('My Teaching Schedule'), findsOneWidget);
      expect(find.text("Today's Schedule"), findsOneWidget);
      expect(find.text('Full Week'), findsOneWidget);
      expect(find.text('Mon'), findsOneWidget);
      expect(find.text('Tue'), findsOneWidget);
      expect(find.text('Wed'), findsOneWidget);
      expect(find.text('Thu'), findsOneWidget);
      expect(find.text('Fri'), findsOneWidget);
      expect(find.text('Sat'), findsOneWidget);
    });

    testWidgets('TeacherPaymentsView renders salary summary and statements',
        (tester) async {
      await tester.pumpWidget(_buildTestApp(const TeacherPaymentsView()));
      await tester.pump();

      expect(find.text('My Salary & Payment Receipts'), findsOneWidget);
      expect(find.text('MONTHLY BASE SALARY'), findsOneWidget);
      expect(find.text('ACTIVE PAYROLL'), findsOneWidget);
      expect(find.text('Total Receipts'), findsOneWidget);
      expect(find.text('Total Received'), findsOneWidget);
    });
  });
}
