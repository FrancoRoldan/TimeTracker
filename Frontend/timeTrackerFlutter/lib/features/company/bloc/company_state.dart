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
    required this.memberships,
    this.selectedCompany,
    this.members = const [],
    this.availableUsers = const [],
    this.membersLoading = false,
  });
  final List<Company> companies;
  final List<CompanyMembership> memberships;
  final CompanyMembership? selectedCompany;
  final List<CompanyUser> members;
  final List<AvailableUser> availableUsers;
  final bool membersLoading;

  CompanyLoaded copyWith({
    List<Company>? companies,
    List<CompanyMembership>? memberships,
    CompanyMembership? selectedCompany,
    List<CompanyUser>? members,
    List<AvailableUser>? availableUsers,
    bool? membersLoading,
  }) => CompanyLoaded(
    companies: companies ?? this.companies,
    memberships: memberships ?? this.memberships,
    selectedCompany: selectedCompany ?? this.selectedCompany,
    members: members ?? this.members,
    availableUsers: availableUsers ?? this.availableUsers,
    membersLoading: membersLoading ?? this.membersLoading,
  );

  @override
  List<Object?> get props => [companies, memberships, selectedCompany, members, availableUsers, membersLoading];
}

final class CompanyError extends CompanyState {
  const CompanyError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
