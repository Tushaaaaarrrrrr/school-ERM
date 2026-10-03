import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gi_campus/core/theme/app_theme.dart';
import 'package:gi_campus/core/widgets/app_bottom_nav.dart';
import 'package:gi_campus/data/models/user_model.dart';
import 'package:gi_campus/data/services/auth_service.dart';
import 'package:gi_campus/viewmodels/student_viewmodel.dart';
import 'package:gi_campus/views/shell/main_shell_view.dart';

class TestAuth extends AuthService {
  @override
  UserModel get currentUser => const UserModel(
      id: 'test',
      email: '',
      name: 'Test Student',
      role: UserRole.student,
      schoolId: '',
      schoolName: 'Test School',
      schoolCode: '');
}

void main() {
  testWidgets('More retains selection and back returns to its menu',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthService>(create: (_) => TestAuth()),
          ChangeNotifierProvider(create: (_) => StudentViewModel()),
        ],
        child: MaterialApp(
            theme: AppTheme.lightTheme, home: const MainShellView())));
    await tester.pump();
    await tester.tap(find.text('More'));
    await tester.pump();
    expect(find.text('YOUR WORKSPACE'), findsOneWidget);
    await tester.tap(find.text('Results'));
    await tester.pump();
    expect(tester.widget<AppBottomNav>(find.byType(AppBottomNav)).currentIndex,
        -1);
    expect(find.byIcon(Icons.arrow_back_ios_new), findsOneWidget);
    await tester.tap(find.byIcon(Icons.arrow_back_ios_new));
    await tester.pump();
    expect(find.text('YOUR WORKSPACE'), findsOneWidget);
    await tester.tap(find.text('Home').last);
    await tester.pump();
    expect(
        tester.widget<AppBottomNav>(find.byType(AppBottomNav)).currentIndex, 0);
    await tester.pumpWidget(const SizedBox());
  });
}
