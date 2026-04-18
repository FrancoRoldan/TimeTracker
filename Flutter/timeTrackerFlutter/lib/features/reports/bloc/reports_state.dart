import 'package:equatable/equatable.dart';
import '../../../core/models/reports/user_report.dart';
import '../../../core/models/reports/project_report.dart';
import '../../../core/models/reports/company_report.dart';

sealed class ReportsState extends Equatable {
  const ReportsState();
  @override
  List<Object?> get props => [];
}

final class ReportsInitial extends ReportsState { const ReportsInitial(); }
final class ReportsLoading extends ReportsState { const ReportsLoading(); }

final class UserReportLoaded extends ReportsState {
  const UserReportLoaded({required this.report});
  final UserReport report;
  @override
  List<Object?> get props => [report];
}

final class ProjectReportLoaded extends ReportsState {
  const ProjectReportLoaded({required this.report});
  final ProjectReport report;
  @override
  List<Object?> get props => [report];
}

final class CompanyReportLoaded extends ReportsState {
  const CompanyReportLoaded({required this.report});
  final CompanyReport report;
  @override
  List<Object?> get props => [report];
}

final class ReportsError extends ReportsState {
  const ReportsError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
