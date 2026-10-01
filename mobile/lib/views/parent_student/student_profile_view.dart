import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/auth_service.dart';
import '../../viewmodels/student_viewmodel.dart';

class StudentProfileView extends StatelessWidget {
  const StudentProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;
    final student = context.watch<StudentViewModel>().student;
    final displayName =
        student.fullName.isNotEmpty ? student.fullName : user.name;
    final studentId = student.admissionNumber.isNotEmpty
        ? student.admissionNumber
        : (user.loginId ?? '');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Digital Student ID Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4338CA), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Colors.white24,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const AppSvgIcon('sparkles',
                              size: 16, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.schoolName,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12),
                            ),
                            const Text(
                              'STUDENT IDENTITY CARD',
                              style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 9,
                                  letterSpacing: 1),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const StatusBadge(label: '2026-27', type: StatusType.info),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white38, width: 2),
                      ),
                      alignment: Alignment.center,
                      child: const AppSvgIcon('graduation_cap',
                          size: 36, color: Colors.white),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            [
                              if (student.className.isNotEmpty)
                                student.className,
                              if (student.section.isNotEmpty)
                                'Section: ${student.section}',
                              if (student.rollNumber.isNotEmpty)
                                'Roll: ${student.rollNumber}',
                            ].join('  •  '),
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 12),
                          ),
                          if (studentId.isNotEmpty)
                            Text(
                              'Student ID: $studentId',
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 11),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Profile Options
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const AppSvgIcon('id_card',
                      size: 18, color: AppColors.primary),
                  title: const Text('Student Details',
                      style:
                          TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.chevron_right,
                      size: 18, color: AppColors.textMuted),
                  onTap: () => _showStudentDetails(context, studentId),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const AppSvgIcon('phone',
                      size: 18, color: AppColors.primary),
                  title: const Text('Emergency Contacts',
                      style:
                          TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.chevron_right,
                      size: 18, color: AppColors.textMuted),
                  onTap: () => _showEmergencyContacts(context),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const AppSvgIcon('shield_check',
                      size: 18, color: AppColors.primary),
                  title: const Text('Privacy & Security',
                      style:
                          TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.chevron_right,
                      size: 18, color: AppColors.textMuted),
                  onTap: () => _showPrivacySecurity(context),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const AppSvgIcon('logout',
                      size: 18, color: AppColors.danger),
                  title: const Text('Sign Out',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.danger)),
                  onTap: () => auth.logout(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showStudentDetails(BuildContext context, String studentId) {
    final student = context.read<StudentViewModel>().student;
    _showInfoSheet(
      context,
      'Student Details',
      [
        if (student.fullName.isNotEmpty) _InfoLine('Name', student.fullName),
        if (student.className.isNotEmpty) _InfoLine('Class', student.className),
        if (student.section.isNotEmpty) _InfoLine('Section', student.section),
        if (student.rollNumber.isNotEmpty)
          _InfoLine('Roll', student.rollNumber),
        if (studentId.isNotEmpty) _InfoLine('Student ID', studentId),
        if (student.gender.isNotEmpty) _InfoLine('Gender', student.gender),
      ],
    );
  }

  void _showEmergencyContacts(BuildContext context) {
    final student = context.read<StudentViewModel>().student;
    _showInfoSheet(
      context,
      'Emergency Contacts',
      [
        if ((student.parentName ?? '').isNotEmpty)
          _InfoLine('Guardian', student.parentName!),
        if ((student.parentPhone ?? '').isNotEmpty)
          _InfoLine('Phone', student.parentPhone!),
      ],
    );
  }

  void _showPrivacySecurity(BuildContext context) {
    final user = context.read<AuthService>().currentUser;
    _showInfoSheet(
      context,
      'Privacy & Security',
      [
        _InfoLine('Signed in as', user.email),
        _InfoLine('Role', user.roleDisplayName),
        if ((user.loginId ?? '').isNotEmpty)
          _InfoLine('Login ID', user.loginId!),
      ],
    );
  }

  void _showInfoSheet(
      BuildContext context, String title, List<_InfoLine> rows) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (rows.isEmpty)
              const Text('No information returned by the school yet.',
                  style: TextStyle(color: AppColors.textSecondary))
            else
              ...rows.map((row) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 92,
                          child: Text(row.label,
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.textMuted)),
                        ),
                        Expanded(
                          child: Text(row.value,
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}

class _InfoLine {
  final String label;
  final String value;

  const _InfoLine(this.label, this.value);
}
