import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase/supabase.dart';

import '../models/fee_model.dart';
import '../models/notice_model.dart';
import '../models/student_model.dart';
import '../models/user_model.dart';

class ApiClient {
  static const _baseUrlKey = 'api_base_url';
  static const _sessionKey = 'api_session_cookie';
  static const _defaultBaseUrl = String.fromEnvironment('API_BASE_URL',
      defaultValue: 'https://school-erm.onrender.com');
  static const _supabaseUrl = String.fromEnvironment('SUPABASE_URL',
      defaultValue: 'https://ruyclbizuxocnipidhih.supabase.co');
  static const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY',
      defaultValue:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eWNsYml6dXhvY25pcGlkaGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTU2MDEsImV4cCI6MjEwMzA3MTYwMX0.8A7Pr42GNbEwRm9CgDdlzZ7yXW-pm8DREDak71Bdxog');
  static const _googleWebClientId =
      String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');

  ApiClient._();

  static String? _resolvedBaseUrl;
  static SupabaseClient? _supabaseClient;

  static Future<void> init() async {
    _supabaseClient ??= SupabaseClient(
      _supabaseUrl,
      _supabaseAnonKey,
      authOptions: const AuthClientOptions(
        autoRefreshToken: false,
        authFlowType: AuthFlowType.implicit,
      ),
    );
  }

  static Future<String> get baseUrl async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_baseUrlKey);
    if (saved != null && saved.isNotEmpty) {
      final clean = saved.trim().replaceAll(RegExp(r'/+$'), '');
      final isOldLocalUrl = clean.contains('10.0.2.2') ||
          clean.contains('localhost') ||
          clean.contains('127.0.0.1');
      if (!isOldLocalUrl || _defaultBaseUrl.isEmpty) return clean;
      await prefs.remove(_baseUrlKey);
    }
    if (_defaultBaseUrl.isNotEmpty) return _defaultBaseUrl;
    if (kIsWeb) return Uri.base.origin;
    if (_resolvedBaseUrl != null) return _resolvedBaseUrl!;

    final host = defaultTargetPlatform == TargetPlatform.android
        ? '10.0.2.2'
        : 'localhost';
    for (final port in [3001, 3000]) {
      try {
        final res = await http
            .get(
                Uri.parse('http://$host:$port/api/auth/lookup?identifier=ping'))
            .timeout(const Duration(milliseconds: 700));
        if (res.statusCode == 200) {
          _resolvedBaseUrl = 'http://$host:$port';
          return _resolvedBaseUrl!;
        }
      } catch (_) {}
    }
    return 'http://$host:3001';
  }

  static Future<void> setBaseUrl(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _baseUrlKey, value.trim().replaceAll(RegExp(r'/+$'), ''));
  }

  static Future<UserModel> loginWithGoogle() async {
    if (_googleWebClientId.isEmpty) {
      throw Exception(
          'Missing GOOGLE_WEB_CLIENT_ID for native Google sign-in.');
    }
    await init();
    final googleUser =
        await GoogleSignIn(serverClientId: _googleWebClientId).signIn();
    if (googleUser == null) throw Exception('Google sign-in was cancelled.');

    final googleAuth = await googleUser.authentication;
    if (googleAuth.idToken == null) {
      throw Exception('Google did not return an ID token.');
    }

    final auth = await _supabaseClient!.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: googleAuth.idToken!,
      accessToken: googleAuth.accessToken,
    );
    final token = auth.session?.accessToken;
    if (token == null) {
      throw Exception('Supabase did not return a mobile session.');
    }

    final json = await _post('/api/mobile/auth/google', {},
        includeSession: false, bearerToken: token);
    if (json['user'] == null) {
      throw Exception(
          json['error'] ?? 'No school access found for this Google account.');
    }
    final user = UserModel.fromJson(Map<String, dynamic>.from(json['user']));
    await _saveSession(user);
    return user;
  }

  static Future<UserModel> login(
      String identifier, String password, String schoolCode) async {
    try {
      final lookup = await _get(
          '/api/auth/lookup',
          {
            'identifier': identifier,
            if (schoolCode.trim().isNotEmpty) 'schoolCode': schoolCode.trim(),
          },
          false);
      if (lookup['exists'] != true || lookup['user'] == null) {
        throw Exception(
            lookup['error'] ?? 'Account not found in school database.');
      }

      final pass = await _post(
          '/api/auth/password',
          {
            'action': 'verify',
            'identifier': identifier,
            'userId': lookup['user']['id'],
            'email': lookup['user']['email'],
            'loginId': lookup['user']['login_id'],
            'role': lookup['user']['role'],
            'password': password,
          },
          includeSession: false);
      if (pass['valid'] != true) {
        throw Exception('Invalid password. Please check your credentials.');
      }

      final user =
          UserModel.fromJson(Map<String, dynamic>.from(lookup['user']));
      await _saveSession(user);
      return user;
    } catch (e) {
      final errStr = e.toString().toLowerCase();
      final isNetworkError = errStr.contains('socketexception') ||
          errStr.contains('connection refused') ||
          errStr.contains('failed host lookup') ||
          errStr.contains('clientexception') ||
          errStr.contains('timed out');
      if (isNetworkError) {
        throw Exception(
            'Unable to reach server. Please check your network connection.');
      }
      rethrow;
    }
  }

  static Future<List<StudentModel>> getStudents({String? schoolId}) async {
    final json = await _get('/api/students', {
      if (schoolId != null && schoolId.isNotEmpty) 'schoolId': schoolId,
    });
    final data = (json['data'] as List? ?? const []);
    return data
        .map((e) => StudentModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  static Future<StudentModel> createStudent({
    required String schoolId,
    required String fullName,
    required String admissionNumber,
    String className = '',
    String section = '',
  }) async {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    final firstName = parts.isEmpty ? fullName.trim() : parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';
    final json = await _post('/api/students', {
      'school_id': schoolId,
      'first_name': firstName,
      'last_name': lastName,
      'registration_number': admissionNumber.trim(),
      'joining_date': DateTime.now().toIso8601String().split('T').first,
      'status': 'active',
      if (className.trim().isNotEmpty || section.trim().isNotEmpty)
        'current_enrollment': {
          'class_name': className.trim(),
          'section_name': section.trim(),
        },
    });
    return StudentModel.fromJson(Map<String, dynamic>.from(json['data']));
  }

  static Future<List<NoticeModel>> getNotices() async {
    final json = await _get('/api/notices');
    final data = (json['data'] as List? ?? const []);
    return data
        .map((e) => NoticeModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  static Future<List<FeeInvoiceModel>> getFeeInvoices() async {
    final json = await _get('/api/fee-invoices');
    final data = (json['data'] as List? ?? const []);
    return data
        .map((e) => FeeInvoiceModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  static Future<List<Map<String, dynamic>>> getAcademicYears() async {
    final json = await _get('/api/academic-years');
    return _listFromJson(json);
  }

  static Future<void> createFeeInvoice({
    required String studentId,
    required String academicYearId,
    required double amount,
    required DateTime dueDate,
    required DateTime billingMonth,
  }) async {
    await _post('/api/fee-invoices', {
      'student_id': studentId,
      'academic_year_id': academicYearId,
      'billing_month': billingMonth.toIso8601String().split('T').first,
      'base_amount': amount,
      'discount_amount': 0,
      'late_fee': 0,
      'final_amount': amount,
      'paid_amount': 0,
      'due_date': dueDate.toIso8601String().split('T').first,
      'status': 'pending',
    });
  }

  static Future<List<Map<String, dynamic>>> getSchools() async {
    final json = await _get('/api/schools');
    return _listFromJson(json);
  }

  static Future<List<Map<String, dynamic>>> getUsers() async {
    final json = await _get('/api/users');
    return _listFromJson(json);
  }

  static Future<List<Map<String, dynamic>>> getAccessRequests() async {
    final json = await _get('/api/access-requests');
    return _listFromJson(json);
  }

  static Future<List<Map<String, dynamic>>> getAuthEvents(
      {int limit = 50}) async {
    final json = await _get('/api/auth/events', {'limit': '$limit'});
    return _listFromJson(json);
  }

  static List<Map<String, dynamic>> _listFromJson(Map<String, dynamic> json) {
    final data = (json['data'] as List? ?? const []);
    return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<Map<String, dynamic>> _get(String path,
      [Map<String, String> query = const {},
      bool includeSession = true]) async {
    final base = await baseUrl;
    final uri = Uri.parse('$base$path')
        .replace(queryParameters: query.isEmpty ? null : query);
    final response =
        await http.get(uri, headers: await _headers(includeSession));
    return _decode(response);
  }

  static Future<Map<String, dynamic>> _post(
      String path, Map<String, dynamic> body,
      {bool includeSession = true, String? bearerToken}) async {
    final base = await baseUrl;
    final response = await http.post(
      Uri.parse('$base$path'),
      headers: await _headers(includeSession, bearerToken: bearerToken),
      body: jsonEncode(body),
    );
    return _decode(response);
  }

  static Future<Map<String, String>> _headers(bool includeSession,
      {String? bearerToken}) async {
    final headers = {'content-type': 'application/json'};
    if (bearerToken != null) headers['authorization'] = 'Bearer $bearerToken';
    if (includeSession) {
      final prefs = await SharedPreferences.getInstance();
      final session = prefs.getString(_sessionKey);
      if (session != null) headers['cookie'] = 'school_erp_session=$session';
    }
    return headers;
  }

  static Map<String, dynamic> _decode(http.Response response) {
    final Map<String, dynamic> json;
    try {
      json = jsonDecode(response.body.isEmpty ? '{}' : response.body)
          as Map<String, dynamic>;
    } catch (_) {
      throw Exception(
          'Server API is not ready yet. Please deploy the latest backend to Render, then try again.');
    }
    if (response.statusCode >= 400 || json['success'] == false) {
      throw Exception(json['error'] ?? 'Request failed.');
    }
    return json;
  }

  static Future<void> _saveSession(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _sessionKey, Uri.encodeComponent(jsonEncode(user.toJson())));
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }
}
