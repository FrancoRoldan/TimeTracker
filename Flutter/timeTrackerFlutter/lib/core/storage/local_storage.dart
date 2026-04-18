import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';
import '../models/user.dart';

/// Abstracción de persistencia local.
/// - Token JWT → FlutterSecureStorage (cifrado)
/// - Resto (user, companies, theme) → SharedPreferences
class LocalStorage {
  LocalStorage({
    required SharedPreferences prefs,
    required FlutterSecureStorage secureStorage,
  })  : _prefs = prefs,
        _secure = secureStorage;

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;

  // ── Token ────────────────────────────────────────────────────────────────

  Future<void> saveToken(String token) =>
      _secure.write(key: ApiConstants.keyToken, value: token);

  Future<String?> getToken() =>
      _secure.read(key: ApiConstants.keyToken);

  Future<void> deleteToken() =>
      _secure.delete(key: ApiConstants.keyToken);

  // ── User ─────────────────────────────────────────────────────────────────

  Future<void> saveUser(User user) async =>
      _prefs.setString(ApiConstants.keyUser, jsonEncode(user.toJson()));

  User? getUser() {
    final raw = _prefs.getString(ApiConstants.keyUser);
    if (raw == null) return null;
    return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  // ── Companies ─────────────────────────────────────────────────────────────

  Future<void> saveCompanies(List<CompanyMembership> companies) async =>
      _prefs.setString(
        ApiConstants.keyCompanies,
        jsonEncode(companies.map((c) => c.toJson()).toList()),
      );

  List<CompanyMembership> getCompanies() {
    final raw = _prefs.getString(ApiConstants.keyCompanies);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => CompanyMembership.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Selected Company ──────────────────────────────────────────────────────

  Future<void> saveSelectedCompany(CompanyMembership company) async =>
      _prefs.setString(
        ApiConstants.keySelectedCompany,
        jsonEncode(company.toJson()),
      );

  CompanyMembership? getSelectedCompany() {
    final raw = _prefs.getString(ApiConstants.keySelectedCompany);
    if (raw == null) return null;
    return CompanyMembership.fromJson(
        jsonDecode(raw) as Map<String, dynamic>);
  }

  int? getSelectedCompanyId() => getSelectedCompany()?.companyId;

  // ── Theme ─────────────────────────────────────────────────────────────────

  Future<void> saveTheme(String theme) async =>
      _prefs.setString(ApiConstants.keyTheme, theme);

  String getTheme() => _prefs.getString(ApiConstants.keyTheme) ?? 'blue';

  Future<void> saveDarkMode(bool value) async =>
      _prefs.setBool(ApiConstants.keyDarkMode, value);

  bool getDarkMode() => _prefs.getBool(ApiConstants.keyDarkMode) ?? false;

  // ── Clear ─────────────────────────────────────────────────────────────────

  Future<void> clearAll() async {
    await deleteToken();
    await _prefs.remove(ApiConstants.keyUser);
    await _prefs.remove(ApiConstants.keyCompanies);
    await _prefs.remove(ApiConstants.keySelectedCompany);
  }
}
