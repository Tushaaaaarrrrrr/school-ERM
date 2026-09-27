class SubjectMark {
  final String subjectName;
  final double marksObtained;
  final double maxMarks;
  final String grade;
  final String? remarks;

  const SubjectMark({
    required this.subjectName,
    required this.marksObtained,
    required this.maxMarks,
    required this.grade,
    this.remarks,
  });

  double get percentage => (marksObtained / maxMarks) * 100;
}

class ExamResultModel {
  final String id;
  final String examTitle;
  final String term;
  final DateTime publishedDate;
  final List<SubjectMark> subjects;

  const ExamResultModel({
    required this.id,
    required this.examTitle,
    required this.term,
    required this.publishedDate,
    required this.subjects,
  });

  double get totalMarksObtained => subjects.fold(0, (acc, s) => acc + s.marksObtained);
  double get totalMaxMarks => subjects.fold(0, (acc, s) => acc + s.maxMarks);
  double get overallPercentage => totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
  
  String get overallGrade {
    final p = overallPercentage;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'E';
  }
}
