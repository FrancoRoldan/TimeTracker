import 'package:json_annotation/json_annotation.dart';

part 'time_entry.g.dart';

@JsonSerializable()
class TimeEntry {
  const TimeEntry({
    required this.id,
    required this.userId,
    required this.userName,
    required this.startTime,
    this.projectId,
    this.projectName,
    this.issueId,
    this.issueTitle,
    this.endTime,
    this.durationMinutes,
    this.description,
  });

  factory TimeEntry.fromJson(Map<String, dynamic> json) =>
      _$TimeEntryFromJson(json);

  final int id;
  final int? projectId;
  final String? projectName;
  final int? issueId;
  final String? issueTitle;
  final int userId;
  final String userName;
  final DateTime startTime;
  final DateTime? endTime;
  final int? durationMinutes;
  final String? description;

  bool get isActive => endTime == null;

  Duration get elapsed {
    final end = endTime ?? DateTime.now();
    return end.difference(startTime);
  }

  Map<String, dynamic> toJson() => _$TimeEntryToJson(this);
}
