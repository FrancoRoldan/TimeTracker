import 'package:equatable/equatable.dart';
import '../../../core/models/company.dart';
import '../../../core/models/user.dart';

sealed class CompanyState extends Equatable {
  const CompanyState();
  @override
  List<Object?> get props => [];
}

final class CompanyInitial extends CompanyState { const CompanyInitial(); }
final class CompanyLoading extends CompanyState { const CompanyLoading(); }

final class CompanyLoaded extends CompanyState {
  const CompanyLoaded({
    required this.companies,
    required this.selectedCompany,
  });
  final List<Company> companies;
  final CompanyMembership? selectedCompany;
  @override
  List<Object?> get props => [companies, selectedCompany];
}

final class CompanyError extends CompanyState {
  const CompanyError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
