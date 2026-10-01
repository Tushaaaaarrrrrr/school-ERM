import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../data/services/auth_service.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;
  bool _passwordVisible = false;

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Brand Logo & Header
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset(
                      'assets/icons/logo.png',
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'GI Campus',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Next-Gen Mobile Management',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 40),
              OutlinedButton(
                onPressed: authService.isLoading
                    ? null
                    : authService.continueWithGoogle,
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: AppColors.border),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _GoogleMark(),
                    SizedBox(width: 10),
                    Text('Continue with Google',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              const Row(
                children: [
                  Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR SIGN IN WITH CREDENTIALS',
                        style: TextStyle(
                            fontSize: 10,
                            color: AppColors.textMuted,
                            fontWeight: FontWeight.w800)),
                  ),
                  Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
              const SizedBox(height: 18),

              TextField(
                controller: _identifier,
                keyboardType: TextInputType.text,
                autocorrect: false,
                enabled: !_showPassword && !authService.isLoading,
                decoration: const InputDecoration(
                  labelText: 'Email, Registration ID or School Code',
                  hintText: 'Enter your login ID',
                  prefixIcon: Padding(
                    padding: EdgeInsets.all(12),
                    child: AppSvgIcon('teacher',
                        size: 18, color: AppColors.textMuted),
                  ),
                ),
              ),
              if (_showPassword) ...[
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: authService.isLoading
                        ? null
                        : () => setState(() {
                              _showPassword = false;
                              _password.clear();
                            }),
                    icon: const Icon(Icons.arrow_back, size: 16),
                    label: const Text('Change login ID'),
                  ),
                ),
                const SizedBox(height: 4),
                TextField(
                  controller: _password,
                  obscureText: !_passwordVisible,
                  autofocus: true,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Enter your account password',
                    prefixIcon: const Padding(
                      padding: EdgeInsets.all(12),
                      child: AppSvgIcon('shield_check',
                          size: 18, color: AppColors.textMuted),
                    ),
                    suffixIcon: IconButton(
                      tooltip:
                          _passwordVisible ? 'Hide password' : 'Show password',
                      icon: Icon(
                        _passwordVisible
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppColors.textMuted,
                      ),
                      onPressed: () =>
                          setState(() => _passwordVisible = !_passwordVisible),
                    ),
                  ),
                ),
              ],
              if (authService.error != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.dangerLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.danger, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          authService.error!,
                          style: const TextStyle(
                              color: AppColors.danger, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: authService.isLoading
                    ? null
                    : () {
                        final id = _identifier.text.trim();
                        if (id.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    'Please enter your email, registration ID or school code.')),
                          );
                          return;
                        }
                        if (!_showPassword) {
                          setState(() => _showPassword = true);
                          return;
                        }
                        final pass = _password.text;
                        if (pass.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Please enter your password.')),
                          );
                          return;
                        }
                        authService.login(
                          id,
                          pass,
                        );
                      },
                child: Text(authService.isLoading
                    ? 'Signing in...'
                    : (_showPassword ? 'Sign In' : 'Next')),
              ),
              const SizedBox(height: 16),
              const Text(
                'By continuing, you agree to GI Campus Terms and Conditions & Privacy Policy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return const Text('G',
        style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF4285F4)));
  }
}
