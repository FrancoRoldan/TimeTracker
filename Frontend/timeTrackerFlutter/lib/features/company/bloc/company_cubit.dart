import 'package:flutter_bloc/flutter_bloc.dart';
import 'company_state.dart';
import '../data/company_repository.dart';
import '../../../core/models/company.dart';
import '../../../core/models/user.dart';
import '../../../core/storage/local_storage.dart';
import '../../auth/data/auth_repository.dart';

class CompanyCubit extends Cubit<CompanyState> {
  CompanyCubit({
    required this.repository,
    required this.localStorage,
    this.authRepository,
  }) : super(const CompanyInitial());

  final CompanyRepository repository;
  final LocalStorage localStorage;
  final AuthRepository? authRepository;

  /// Inicializa el selector desde localStorage (sin llamada a API).
  /// Se llama al construir el shell.
  void initFromStorage() {
    final memberships = localStorage.getCompanies();
    final selected = localStorage.getSelectedCompany();
    emit(CompanyLoaded(
      companies: const [],
      memberships: memberships,
      selectedCompany: selected,
    ));
  }

  /// Carga empresas desde la API (para CRUD de empresa).
  Future<void> loadCompanies() async {
    final currentMemberships = state is CompanyLoaded
        ? (state as CompanyLoaded).memberships
        : localStorage.getCompanies();
    final selected = localStorage.getSelectedCompany();
    emit(const CompanyLoading());
    try {
      final companies = await repository.getCompanies();
      emit(CompanyLoaded(
        companies: companies,
        memberships: currentMemberships,
        selectedCompany: selected,
      ));
    } catch (e) {
      emit(CompanyError(message: e.toString()));
    }
  }

  Future<void> selectCompany(CompanyMembership company) async {
    await localStorage.saveSelectedCompany(company);
    final current = state;
    if (current is CompanyLoaded) {
      emit(current.copyWith(selectedCompany: company));
    }
  }

  Future<void> loadMembers(int companyId) async {
    final current = state;
    if (current is! CompanyLoaded) return;
    emit(current.copyWith(membersLoading: true));
    try {
      final members = await repository.getCompanyUsers(companyId);
      final available = await repository.getAvailableUsers(companyId);
      final latest = state;
      if (latest is CompanyLoaded) {
        emit(latest.copyWith(
          members: members,
          availableUsers: available,
          membersLoading: false,
        ));
      }
    } catch (e) {
      final latest = state;
      if (latest is CompanyLoaded) {
        emit(latest.copyWith(membersLoading: false));
      }
      // Muestra el error sin destruir el estado CompanyLoaded
      addError(Exception(e.toString()));
    }
  }

  Future<void> addMember(
    int companyId,
    int userId,
    String role,
    double? hourlyRate,
  ) async {
    try {
      await repository.addUserToCompany(companyId, userId, role, hourlyRate);
      await loadMembers(companyId);
    } catch (e) {
      addError(Exception(e.toString()));
    }
  }

  Future<void> updateMember(
    int companyId,
    int userId,
    String? role,
    double? hourlyRate,
  ) async {
    try {
      await repository.updateUserInCompany(companyId, userId, role, hourlyRate);
      await loadMembers(companyId);
    } catch (e) {
      addError(Exception(e.toString()));
    }
  }

  Future<void> removeMember(int companyId, int userId) async {
    try {
      await repository.removeUserFromCompany(companyId, userId);
      await loadMembers(companyId);
    } catch (e) {
      addError(Exception(e.toString()));
    }
  }

  Future<void> resetMemberPassword(int userId, String newPassword) async {
    try {
      await repository.resetMemberPassword(userId, newPassword);
    } catch (e) {
      addError(Exception(e.toString()));
    }
  }

  Future<void> createCompany(String name, String code) async {
    final prevLoaded = state is CompanyLoaded ? state as CompanyLoaded : null;
    try {
      final Company company = await repository.createCompany(name, code);
      final newMembership = CompanyMembership(
        companyId: company.id,
        companyName: company.name,
        companyCode: company.code,
        role: 'Admin',
      );
      final updatedMemberships = <CompanyMembership>[
        ...(prevLoaded?.memberships ?? const <CompanyMembership>[]),
        newMembership,
      ];
      final updatedCompanies = <Company>[
        ...(prevLoaded?.companies ?? const <Company>[]),
        company,
      ];
      await localStorage.saveCompanies(updatedMemberships);
      await localStorage.saveSelectedCompany(newMembership);
      // Refresh JWT so the new company is included in CompanyIds claim
      await authRepository?.refreshToken();
      emit(CompanyLoaded(
        companies: updatedCompanies,
        memberships: updatedMemberships,
        selectedCompany: newMembership,
      ));
    } catch (e) {
      emit(CompanyError(message: e.toString()));
    }
  }

  Future<void> deleteCompany(int id) async {
    try {
      await repository.deleteCompany(id);
      await loadCompanies();
    } catch (e) {
      emit(CompanyError(message: e.toString()));
    }
  }
}
