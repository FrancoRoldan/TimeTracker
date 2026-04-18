import 'package:flutter_bloc/flutter_bloc.dart';
import 'reports_state.dart';
import '../data/reports_repository.dart';

class ReportsCubit extends Cubit<ReportsState> {
  ReportsCubit({required this.repository}) : super(const ReportsInitial());

  final ReportsRepository repository;

  Future<void> loadUserReport({DateTime? dateFrom, DateTime? dateTo, int? projectId}) async {
    emit(const ReportsLoading());
    try {
      final report = await repository.getUserReport(
        dateFrom: dateFrom, dateTo: dateTo, projectId: projectId);
      emit(UserReportLoaded(report: report));
    } catch (e) {
      emit(ReportsError(message: e.toString()));
    }
  }

  Future<void> loadProjectReport(int projectId, {DateTime? dateFrom, DateTime? dateTo}) async {
    emit(const ReportsLoading());
    try {
      final report = await repository.getProjectReport(
        projectId, dateFrom: dateFrom, dateTo: dateTo);
      emit(ProjectReportLoaded(report: report));
    } catch (e) {
      emit(ReportsError(message: e.toString()));
    }
  }

  Future<void> loadCompanyReport(int companyId, {DateTime? dateFrom, DateTime? dateTo}) async {
    emit(const ReportsLoading());
    try {
      final report = await repository.getCompanyReport(
        companyId, dateFrom: dateFrom, dateTo: dateTo);
      emit(CompanyReportLoaded(report: report));
    } catch (e) {
      emit(ReportsError(message: e.toString()));
    }
  }
}
