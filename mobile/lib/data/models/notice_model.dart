class NoticeModel {
  final String id;
  final String title;
  final String content;
  final String category;
  final DateTime date;
  final bool isUrgent;

  const NoticeModel({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.date,
    this.isUrgent = false,
  });

  DateTime get publishedDate => date;

  factory NoticeModel.fromJson(Map<String, dynamic> json) {
    return NoticeModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? json['message'] as String? ?? '',
      category: json['category'] as String? ?? 'Notice',
      date: DateTime.tryParse(json['date'] as String? ?? json['created_at'] as String? ?? '') ?? DateTime.now(),
      isUrgent: json['is_urgent'] as bool? ?? json['priority'] == 'urgent',
    );
  }
}
