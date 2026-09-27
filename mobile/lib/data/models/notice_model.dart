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
}
