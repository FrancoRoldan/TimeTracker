class PaginatedResult<T> {
  const PaginatedResult({
    required this.items,
    required this.pageNumber,
    required this.pageSize,
    required this.totalCount,
    required this.totalPages,
    required this.hasNextPage,
    required this.hasPreviousPage,
  });

  factory PaginatedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Object?) fromJsonT,
  ) {
    return PaginatedResult<T>(
      items: (json['items'] as List).map(fromJsonT).toList(),
      pageNumber: json['pageNumber'] as int,
      pageSize: json['pageSize'] as int,
      totalCount: json['totalCount'] as int,
      totalPages: json['totalPages'] as int,
      hasNextPage: json['hasNextPage'] as bool,
      hasPreviousPage: json['hasPreviousPage'] as bool,
    );
  }

  final List<T> items;
  final int pageNumber;
  final int pageSize;
  final int totalCount;
  final int totalPages;
  final bool hasNextPage;
  final bool hasPreviousPage;
}
