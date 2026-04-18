import 'package:equatable/equatable.dart';
import '../../../core/models/issue.dart';

sealed class IssueState extends Equatable {
  const IssueState();
  @override
  List<Object?> get props => [];
}

final class IssueInitial extends IssueState { const IssueInitial(); }
final class IssueLoading extends IssueState { const IssueLoading(); }

final class IssueLoaded extends IssueState {
  const IssueLoaded({required this.issues, this.selected});
  final List<Issue> issues;
  final Issue? selected;
  @override
  List<Object?> get props => [issues, selected];
}

final class IssueError extends IssueState {
  const IssueError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
