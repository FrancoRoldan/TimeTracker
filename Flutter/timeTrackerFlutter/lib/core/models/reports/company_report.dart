import 'package:json_annotation/json_annotation.dart';
import 'user_report.dart';
import 'project_report.dart';

part 'company_report.g.dart';

@JsonSerializable()
class CompanyReport {
  const CompanyReport({
    required this.companyId,
    required this.companyName,
    required this.totalHours,
    required this.totalMinutes,
    required this.userBreakdown,
    required this.projectBreakdown,
    required this.dailyBreakdown,
    this.dateFrom,
    this.dateTo,
  });

  factory CompanyReport.fromJson(Map<String, dynamic> json) =>
      _$CompanyReportFromJson(json);

  final int companyId;
  final String companyName;
  final double totalHours;
  final int totalMinutes;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final List<UserBreakdown> userBreakdown;
  final List<ProjectBreakdown> projectBreakdown;
  final List<DailyBreakdown> dailyBreakdown;

  Map<String, dynamic> toJson() => _$CompanyReportToJson(this);
}
