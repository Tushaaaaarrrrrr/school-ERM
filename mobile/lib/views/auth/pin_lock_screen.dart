import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/services/auth_service.dart';
import '../../data/models/user_model.dart';

class PinLockScreen extends StatefulWidget {
  const PinLockScreen({super.key});

  @override
  State<PinLockScreen> createState() => _PinLockScreenState();
}

class _PinLockScreenState extends State<PinLockScreen> {
  String _pin = '';
  String? _errorMessage;

  void _onDigitPressed(String digit) {
    final auth = context.read<AuthService>();
    if (auth.isPinLocked) return;

    if (_pin.length < 5) {
      setState(() {
        _pin += digit;
        _errorMessage = null;
      });

      if (_pin.length == 5) {
        _verifyCurrentPin();
      }
    }
  }

  void _onBackspacePressed() {
    final auth = context.read<AuthService>();
    if (auth.isPinLocked) return;

    if (_pin.isNotEmpty) {
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
        _errorMessage = null;
      });
    }
  }

  void _onClearPressed() {
    final auth = context.read<AuthService>();
    if (auth.isPinLocked) return;

    setState(() {
      _pin = '';
      _errorMessage = null;
    });
  }

  void _verifyCurrentPin() {
    final auth = context.read<AuthService>();
    final success = auth.verifyPin(_pin);

    if (!success) {
      setState(() {
        _pin = '';
        if (auth.isPinLocked) {
          _errorMessage =
              'Account Locked: 5 failed PIN attempts reached. Please contact your administrator.';
        } else {
          _errorMessage =
              'Incorrect PIN. ${auth.remainingPinAttempts} attempts remaining.';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;
    final isLocked = auth.isPinLocked;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Top Shield Icon
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: isLocked ? Colors.red.shade600 : const Color(0xFF4F46E5),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: (isLocked ? Colors.red : const Color(0xFF4F46E5))
                            .withOpacity(0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Icon(
                    isLocked ? Icons.security_update_warning_rounded : Icons.lock_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 16),

                // Title
                Text(
                  isLocked ? 'Security Lockout' : 'Security Verification',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),

                // Subtitle
                Text(
                  isLocked
                      ? '5 failed PIN attempts exceeded'
                      : 'Enter your 5-digit PIN to access portal',
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 12),

                // User Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${user.name} (${user.role.name.toUpperCase()})',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                if (isLocked) ...[
                  // Locked Alert Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade900.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.red.shade700),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            color: Colors.redAccent, size: 28),
                        const SizedBox(height: 8),
                        Text(
                          user.role == UserRole.schoolAdmin
                              ? 'Principal Account Locked\nPlease contact Super Admin (pay.laxmikant@gmail.com) to reset your PIN.'
                              : 'Account Locked\nPlease contact your School Principal to reset your 5-digit PIN.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ] else ...[
                  // 5-Digit Dots
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      final isFilled = _pin.length > index;
                      final isCurrent = _pin.length == index;

                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        width: isFilled ? 18 : 14,
                        height: isFilled ? 18 : 14,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isFilled
                              ? const Color(0xFF6366F1)
                              : isCurrent
                                  ? const Color(0xFF4338CA).withOpacity(0.5)
                                  : const Color(0xFF334155),
                          border: Border.all(
                            color: isFilled
                                ? const Color(0xFFA5B4FC)
                                : isCurrent
                                    ? const Color(0xFF818CF8)
                                    : const Color(0xFF475569),
                            width: 2,
                          ),
                          boxShadow: isFilled
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF6366F1).withOpacity(0.5),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  )
                                ]
                              : null,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 12),

                  // Attempts Counter
                  Text(
                    auth.remainingPinAttempts < 3
                        ? '⚠️ ${auth.remainingPinAttempts} attempts remaining before lockout'
                        : 'Max 5 attempts • ${auth.remainingPinAttempts} remaining',
                    style: TextStyle(
                      color: auth.remainingPinAttempts < 3
                          ? Colors.redAccent
                          : const Color(0xFF94A3B8),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Error Message
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  const SizedBox(height: 20),

                  // Numeric Dial Keypad
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 280),
                    child: GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.3,
                      children: [
                        for (var i = 1; i <= 9; i++) _buildKey('$i'),
                        _buildActionKey('Clear', _onClearPressed),
                        _buildKey('0'),
                        _buildActionKey(
                          '⌫',
                          _onBackspacePressed,
                          icon: Icons.backspace_outlined,
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Sign out / Persona Switch
                TextButton.icon(
                  onPressed: () => auth.logout(),
                  icon: const Icon(Icons.logout_rounded, size: 16, color: Color(0xFF94A3B8)),
                  label: const Text(
                    'Sign Out / Switch User',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKey(String label) {
    return Material(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => _onDigitPressed(label),
        borderRadius: BorderRadius.circular(16),
        splashColor: const Color(0xFF4F46E5).withOpacity(0.3),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionKey(String label, VoidCallback onTap, {IconData? icon}) {
    return Material(
      color: const Color(0xFF0F172A),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Center(
          child: icon != null
              ? Icon(icon, color: const Color(0xFF94A3B8), size: 20)
              : Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }
}
