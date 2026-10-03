import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gi_campus/core/theme/app_theme.dart';
import 'package:gi_campus/data/models/user_model.dart';
import 'package:gi_campus/data/services/auth_service.dart';
import 'package:gi_campus/views/common/account_view.dart';

class MockAccountAuth extends AuthService {
  final UserModel _user;
  final bool _pinEnabled;

  MockAccountAuth({
    UserModel? user,
    bool pinEnabled = false,
  })  : _user = user ??
            const UserModel(
              id: 'usr-101',
              email: 'principal@greenwood.edu',
              name: 'Dr. Jane Smith',
              role: UserRole.schoolAdmin,
              schoolId: 'sch-01',
              schoolName: 'Greenwood Academy',
              schoolCode: 'GWD-01',
            ),
        _pinEnabled = pinEnabled;

  @override
  UserModel get currentUser => _user;

  @override
  bool get hasPin => _pinEnabled;

  bool logoutCalled = false;
  @override
  Future<void> logout() async {
    logoutCalled = true;
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets(
      'AccountView renders user profile, security section, app info and sign out',
      (tester) async {
    final mockAuth = MockAccountAuth();

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthService>.value(
        value: mockAuth,
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const AccountView(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // 1. User profile card
    expect(find.text('Dr. Jane Smith'), findsOneWidget);
    expect(find.text('principal@greenwood.edu'), findsOneWidget);
    expect(find.text('School Admin'), findsOneWidget);
    expect(find.text('Greenwood Academy'), findsOneWidget);

    // 2. Security section
    expect(find.text('Security'), findsOneWidget);
    expect(find.text('5-Digit App PIN'), findsOneWidget);
    expect(find.text('DISABLED'), findsOneWidget);
    expect(find.text('Set Up PIN'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // 3. App information
    expect(find.text('App Information'), findsOneWidget);
    expect(find.text('1.0.5 (Build 6)'), findsOneWidget);
    expect(find.text('Terms of Service'), findsOneWidget);
    expect(find.text('Privacy Policy'), findsOneWidget);

    // 4. Sign out button
    expect(find.text('Sign Out'), findsOneWidget);

    // 5. Test Dialog Interactions
    // Tap Setup PIN
    await tester.tap(find.text('Set Up PIN'));
    await tester.pumpAndSettle();
    expect(find.text('Set 5-Digit Security PIN'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    // Tap Change Password
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    expect(find.text('Change Password'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    // Tap Sign Out
    await tester.ensureVisible(find.text('Sign Out'));
    await tester.tap(find.text('Sign Out'));
    await tester.pumpAndSettle();
    expect(
        find.text(
            'Are you sure you want to sign out of your account on this device?'),
        findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Sign Out'));
    await tester.pumpAndSettle();
    expect(mockAuth.logoutCalled, isTrue);
  });

  testWidgets(
      'AccountView shows ENABLED badge and Change PIN when PIN is configured',
      (tester) async {
    final mockAuth = MockAccountAuth(pinEnabled: true);

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthService>.value(
        value: mockAuth,
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const AccountView(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ENABLED'), findsOneWidget);
    expect(find.text('Change PIN'), findsOneWidget);
    expect(find.byTooltip('Remove PIN'), findsOneWidget);
  });
}
