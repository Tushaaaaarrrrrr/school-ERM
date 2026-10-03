import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'data/services/api_client.dart';
import 'data/services/auth_service.dart';
import 'viewmodels/student_viewmodel.dart';
import 'viewmodels/driver_viewmodel.dart';
import 'views/auth/login_view.dart';
import 'views/auth/onboarding_view.dart';
import 'views/auth/splash_view.dart';
import 'views/shell/main_shell_view.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProxyProvider<AuthService, StudentViewModel>(
          create: (_) => StudentViewModel(),
          update: (_, auth, vm) {
            final model = vm ?? StudentViewModel();
            if (auth.isAuthenticated) model.loadFor(auth.currentUser);
            return model;
          },
        ),
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
      title: 'GI CAMPUS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const RootGateway(),
    );
  }
}

class RootGateway extends StatefulWidget {
  const RootGateway({super.key});

  @override
  State<RootGateway> createState() => _RootGatewayState();
}

class _RootGatewayState extends State<RootGateway> {
  bool _showSplash = true;
  bool _showIntro = true;

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();

    if (_showSplash) {
      return SplashView(onDone: () => setState(() => _showSplash = false));
    }

    if (!authService.isAuthenticated) {
      if (_showIntro) {
        return OnboardingView(onContinue: () => setState(() => _showIntro = false));
      }
      return const LoginView();
    }

    return const MainShellView();
  }
}
