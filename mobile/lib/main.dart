import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'data/services/auth_service.dart';
import 'viewmodels/teacher_viewmodel.dart';
import 'viewmodels/student_viewmodel.dart';
import 'viewmodels/driver_viewmodel.dart';
import 'views/auth/login_view.dart';
import 'views/shell/main_shell_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => TeacherViewModel()),
        ChangeNotifierProvider(create: (_) => StudentViewModel()),
        ChangeNotifierProvider(create: (_) => DriverViewModel()),
      ],
      child: const SchoolErpApp(),
    ),
  );
}

class SchoolErpApp extends StatelessWidget {
  const SchoolErpApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'School ERP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const RootGateway(),
    );
  }
}

class RootGateway extends StatelessWidget {
  const RootGateway({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();

    if (!authService.isAuthenticated) {
      return const LoginView();
    }

    return const MainShellView();
  }
}
