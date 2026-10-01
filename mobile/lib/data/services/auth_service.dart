import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthService extends ChangeNotifier {
  static const String _keyRole = 'auth_user_role';
  static const String _keyIsAuth = 'auth_is_authenticated';
  static const String _keyIsPinUnlocked = 'auth_is_pin_unlocked';
  static const String _keyPin = 'auth_security_pin';
  static const String _keyUser = 'auth_user';

  UserModel _currentUser = const UserModel(
    id: '',
    email: '',
    name: '',
    role: UserRole.student,
    schoolId: '',
    schoolName: '',
    schoolCode: '',
  );
  bool _isAuthenticated = false;
  String? _error;
  bool _isLoading = false;

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
      final userJson = prefs.getString(_keyUser);
      final isAuth = prefs.getBool(_keyIsAuth) ?? false;
      if (userJson != null && userJson.isNotEmpty && isAuth) {
        final parsedUser = UserModel.fromJsonString(userJson);
        // Wipe legacy mock user from prior installs
        if (parsedUser.schoolCode == 'DPA-001' ||
            parsedUser.schoolName == 'Delhi Public Academy' ||
            parsedUser.id.isEmpty) {
          await prefs.clear();
          _isAuthenticated = false;
        } else {
          _currentUser = parsedUser;
          _isAuthenticated = _currentUser.id.isNotEmpty;
        }
      } else {
        _isAuthenticated = false;
      }
      _securityPin = prefs.getString(_keyPin);
      _isPinUnlocked = prefs.getBool(_keyIsPinUnlocked) ?? (!hasPin);
      notifyListeners();
    } catch (_) {
      _isAuthenticated = false;
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyRole, _currentUser.role.name);
      await prefs.setString(_keyUser, _currentUser.toJsonString());
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
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasPin => _securityPin != null && _securityPin!.trim().length == 5;
  bool get isPinUnlocked => !hasPin || _isPinUnlocked;
  int get failedPinAttempts => _failedPinAttempts;
  int get remainingPinAttempts => (5 - _failedPinAttempts).clamp(0, 5);
  bool get isPinLocked => _isPinLocked;

  Future<bool> login(String identifier, String password, {String schoolCode = ''}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _currentUser = await ApiClient.login(identifier, password, schoolCode);
      _isAuthenticated = true;
      _failedPinAttempts = 0;
      _isPinLocked = false;
      _isPinUnlocked = !hasPin;
      await _saveToPrefs();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isAuthenticated = false;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> continueWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _currentUser = await ApiClient.loginWithGoogle();
      _isAuthenticated = true;
      _failedPinAttempts = 0;
      _isPinLocked = false;
      _isPinUnlocked = !hasPin;
      await _saveToPrefs();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
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

  Future<void> logout() async {
    _isAuthenticated = false;
    _currentUser = const UserModel(
      id: '',
      email: '',
      name: '',
      role: UserRole.student,
      schoolId: '',
      schoolName: '',
      schoolCode: '',
    );
    _isPinUnlocked = true;
    _failedPinAttempts = 0;
    _isPinLocked = false;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyUser);
      await prefs.remove(_keyRole);
      await prefs.setBool(_keyIsAuth, false);
      await ApiClient.clearSession();
    } catch (_) {}
    notifyListeners();
  }
}
