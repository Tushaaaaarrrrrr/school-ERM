import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'mock_data.dart';

class AuthService extends ChangeNotifier {
  static const String _keyRole = 'auth_user_role';
  static const String _keyIsAuth = 'auth_is_authenticated';
  static const String _keyIsPinUnlocked = 'auth_is_pin_unlocked';
  static const String _keyPin = 'auth_security_pin';

  UserModel _currentUser = MockData.demoUsers[0]; // Default: Teacher
  bool _isAuthenticated = true;

  // 5-Digit Security PIN & 5-Attempt Lockout States
  bool _isPinUnlocked = true;
  int _failedPinAttempts = 0;
  bool _isPinLocked = false;
  String? _securityPin; // Optional 5-digit PIN

  AuthService() {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final roleStr = prefs.getString(_keyRole);
      if (roleStr != null) {
        final role = UserRole.values.firstWhere(
          (r) => r.name == roleStr,
          orElse: () => UserRole.teacher,
        );
        _currentUser = MockData.demoUsers.firstWhere(
          (u) => u.role == role,
          orElse: () => MockData.demoUsers.first,
        );
      }
      _isAuthenticated = prefs.getBool(_keyIsAuth) ?? true;
      _securityPin = prefs.getString(_keyPin);
      if (_currentUser.role == UserRole.schoolAdmin && _securityPin == null) {
        _securityPin = '12345';
      }
      _isPinUnlocked = prefs.getBool(_keyIsPinUnlocked) ?? (!hasPin);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyRole, _currentUser.role.name);
      await prefs.setBool(_keyIsAuth, _isAuthenticated);
      await prefs.setBool(_keyIsPinUnlocked, _isPinUnlocked);
      if (_securityPin != null) {
        await prefs.setString(_keyPin, _securityPin!);
      } else {
        await prefs.remove(_keyPin);
      }
    } catch (_) {}
  }

  UserModel get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get hasPin => _securityPin != null && _securityPin!.trim().length == 5;
  bool get isPinUnlocked => !hasPin || _isPinUnlocked;
  int get failedPinAttempts => _failedPinAttempts;
  int get remainingPinAttempts => (5 - _failedPinAttempts).clamp(0, 5);
  bool get isPinLocked => _isPinLocked;

  void switchPersona(UserRole role) {
    final user = MockData.demoUsers.firstWhere(
      (u) => u.role == role,
      orElse: () => MockData.demoUsers.first,
    );
    _currentUser = user;
    _isAuthenticated = true;
    _failedPinAttempts = 0;
    _isPinLocked = false;

    // Super admin never needs PIN; School admin has PIN configured; Teachers/Staff optional
    if (role == UserRole.schoolAdmin) {
      _securityPin = '12345';
      _isPinUnlocked = false;
    } else {
      _securityPin = null; // Optional/unassigned by default
      _isPinUnlocked = true;
    }
    _saveToPrefs();
    notifyListeners();
  }

  void login(String username, String password) {
    _isAuthenticated = true;
    _failedPinAttempts = 0;
    _isPinLocked = false;
    _isPinUnlocked = !hasPin;
    _saveToPrefs();
    notifyListeners();
  }

  bool verifyPin(String enteredPin) {
    if (!hasPin) {
      _isPinUnlocked = true;
      _saveToPrefs();
      notifyListeners();
      return true;
    }

    if (_isPinLocked) return false;

    if (enteredPin.trim() == _securityPin!.trim()) {
      _isPinUnlocked = true;
      _failedPinAttempts = 0;
      _saveToPrefs();
      notifyListeners();
      return true;
    } else {
      _failedPinAttempts += 1;
      if (_failedPinAttempts >= 5) {
        _isPinLocked = true;
      }
      notifyListeners();
      return false;
    }
  }

  void lockPinSession() {
    if (hasPin) {
      _isPinUnlocked = false;
      _saveToPrefs();
      notifyListeners();
    }
  }

  void unlockAndResetPin(String? newPin) {
    if (newPin != null && newPin.trim().length == 5) {
      _securityPin = newPin.trim();
      _failedPinAttempts = 0;
      _isPinLocked = false;
      _isPinUnlocked = false;
    } else {
      // Clear PIN
      _securityPin = null;
      _failedPinAttempts = 0;
      _isPinLocked = false;
      _isPinUnlocked = true;
    }
    _saveToPrefs();
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    _isPinUnlocked = !hasPin;
    _failedPinAttempts = 0;
    _isPinLocked = false;
    _saveToPrefs();
    notifyListeners();
  }
}
