import 'package:flutter_bloc/flutter_bloc.dart';
import 'company_state.dart';
import '../data/company_repository.dart';
import '../../../core/models/user.dart';
import '../../../core/storage/local_storage.dart';

class CompanyCubit extends Cubit<CompanyState> {
  CompanyCubit({
    required this.repository,
    required this.localStorage,
  }) : super(const CompanyInitial());

  final CompanyRepository repository;
  final LocalStorage localStorage;

  Future<void> loadCompanies() async {
    emit(const CompanyLoading());
    try {
      final companies = await repository.getCompanies();
      final selected = localStorage.getSelectedCompany();
      emit(CompanyLoaded(companies: companies, selectedCompany: selected));
    } catch (e) {
      emit(CompanyError(message: e.toString()));
    }
  }

  Future<void> selectCompany(CompanyMembership company) async {
    await localStorage.saveSelectedCompany(company);
    final current = state;
    if (current is CompanyLoaded) {
      emit(CompanyLoaded(companies: current.companies, selectedCompany: company));
    }
  }

  Future<void> createCompany(String name, String code) async {
    try {
      await repository.createCompany(name, code);
      await loadCompanies();
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
