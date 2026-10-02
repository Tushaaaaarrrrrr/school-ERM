import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../core/widgets/user_avatar.dart';
import '../../data/models/student_model.dart';
import 'student_billing_history_sheet.dart';

class StudentDetailSheet extends StatefulWidget {
  final StudentModel student;
  final int initialTabIndex;
  final bool canManageFees;

  const StudentDetailSheet({
    super.key,
    required this.student,
    this.initialTabIndex = 0,
    this.canManageFees = false,
  });

  static void show(
    BuildContext context, {
    required StudentModel student,
    int initialTabIndex = 0,
    bool canManageFees = false,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StudentDetailSheet(
        student: student,
        initialTabIndex: initialTabIndex,
        canManageFees: canManageFees,
      ),
    );
  }

  @override
  State<StudentDetailSheet> createState() => _StudentDetailSheetState();
}

class _StudentDetailSheetState extends State<StudentDetailSheet> {
  late int _selectedTab;

  @override
  void initState() {
    super.initState();
    _selectedTab = widget.initialTabIndex;
  }

  StudentBillingRecord _getBillingRecord() {
    return StudentBillingRecord(
      studentName: widget.student.fullName,
      className: '${widget.student.className}-${widget.student.section}',
      rollNumber: widget.student.rollNumber,
      admissionNumber: widget.student.admissionNumber,
      parentName:
          widget.student.parentName ?? 'Parent of ${widget.student.fullName}',
      parentPhone: widget.student.parentPhone ?? '',
      totalAnnualFee: 0,
      totalPaid: 0,
      totalDue: 0,
      invoices: const [],
      feeStructure: const [],
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.student;
    final phone = s.parentPhone ?? '';
    final parent = s.parentName ?? 'Guardian';
    final billing = _getBillingRecord();

    return DraggableScrollableSheet(
      initialChildSize: 0.90,
      minChildSize: 0.5,
      maxChildSize: 0.96,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag Handle
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),

              // Top Title Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.fullName,
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Class: ${s.className}-${s.section} • Roll: ${s.rollNumber} • Reg ID: ${s.admissionNumber}',
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close,
                          color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Segmented Tab Switcher
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedTab = 0),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedTab == 0
                                  ? Colors.white
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: _selectedTab == 0
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.person,
                                  size: 16,
                                  color: _selectedTab == 0
                                      ? AppColors.primary
                                      : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '360° Profile',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _selectedTab == 0
                                        ? FontWeight.bold
                                        : FontWeight.w500,
                                    color: _selectedTab == 0
                                        ? AppColors.primary
                                        : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedTab = 1),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedTab == 1
                                  ? Colors.white
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: _selectedTab == 1
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.05),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                AppSvgIcon(
                                  'receipt',
                                  size: 14,
                                  color: _selectedTab == 1
                                      ? AppColors.primary
                                      : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Billing & Fees Ledger',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _selectedTab == 1
                                        ? FontWeight.bold
                                        : FontWeight.w500,
                                    color: _selectedTab == 1
                                        ? AppColors.primary
                                        : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const Divider(height: 16),

              Expanded(
                child: _selectedTab == 0
                    ? _buildProfileTab(controller, s, phone, parent)
                    : _buildBillingTab(
                        controller, billing, phone, widget.canManageFees),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileTab(ScrollController controller, StudentModel s,
      String phone, String parent) {
    return ListView(
      controller: controller,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      children: [
        // Profile Hero
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              UserAvatar(name: s.rollNumber, imageUrl: s.photoUrl, radius: 26),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.fullName,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Roll No: ${s.rollNumber} • Class: ${s.className}-${s.section}',
                      style: const TextStyle(
                          color: Color(0xFFE0E7FF), fontSize: 11),
                    ),
                    Text(
                      'Adm #: ${s.admissionNumber}',
                      style: const TextStyle(
                          color: Color(0xFFC7D2FE), fontSize: 10),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'ENROLLED',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Stat Row
        Row(
          children: [
            Expanded(
              child: _DetailStatBox(
                title: 'Attendance',
                value: '${s.attendancePercentage}%',
                subtitle: 'Recorded',
                color: AppColors.success,
                bgColor: AppColors.successLight,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: InkWell(
                onTap: () => setState(() => _selectedTab = 1),
                borderRadius: BorderRadius.circular(10),
                child: const _DetailStatBox(
                  title: 'Fee Status',
                  value: 'View Bills',
                  subtitle: 'Live invoices',
                  color: AppColors.primary,
                  bgColor: AppColors.primaryLight,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Personal & Bio Information Card
        const Text(
          'Personal & Admission Information',
          style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary),
        ),
        const SizedBox(height: 8),

        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _InfoRow(
                    label: 'Gender',
                    value: s.gender.isNotEmpty ? s.gender : 'Not Specified'),
                const Divider(height: 12),
                _InfoRow(label: 'Father / Guardian', value: parent),
                const Divider(height: 12),
                _InfoRow(label: 'Parent Phone', value: phone),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Bus Route
        const Text(
          'Assigned Bus Transport Route',
          style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary),
        ),
        const SizedBox(height: 8),

        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _InfoRow(
                    label: 'Route Line',
                    value: s.busRouteNumber ?? 'Not Assigned'),
                const Divider(height: 12),
                _InfoRow(
                    label: 'Bus Stop Name',
                    value: s.busStopName ?? 'Not Assigned'),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text('Calling parent $phone...'),
                        backgroundColor: AppColors.primary),
                  );
                },
                icon:
                    const Icon(Icons.phone, size: 16, color: AppColors.primary),
                label: const Text('Call Parent'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => setState(() => _selectedTab = 1),
                icon:
                    const AppSvgIcon('receipt', size: 16, color: Colors.white),
                label: const Text('View Ledger'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildBillingTab(ScrollController controller,
      StudentBillingRecord billing, String phone, bool canManageFees) {
    final pending = billing.invoices
        .where((i) =>
            i.status == 'PENDING' ||
            i.status == 'PARTIAL' ||
            i.status == 'UPCOMING')
        .toList();
    final paid = billing.invoices.where((i) => i.status == 'PAID').toList();
    final paidPct = billing.totalAnnualFee > 0
        ? (billing.totalPaid / billing.totalAnnualFee) * 100
        : 0.0;

    return ListView(
      controller: controller,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      children: [
        // Balance Overview Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'OUTSTANDING DUE BALANCE',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${billing.totalDue.toStringAsFixed(0)}',
                        style: TextStyle(
                          color: billing.totalDue > 0
                              ? const Color(0xFFF87171)
                              : const Color(0xFF4ADE80),
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: billing.totalDue > 0
                          ? Colors.red.withOpacity(0.2)
                          : Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: billing.totalDue > 0
                            ? Colors.red.withOpacity(0.4)
                            : Colors.green.withOpacity(0.4),
                      ),
                    ),
                    child: Text(
                      billing.totalDue > 0 ? 'PAYMENT PENDING' : 'CLEARED',
                      style: TextStyle(
                        color: billing.totalDue > 0
                            ? const Color(0xFFFCA5A5)
                            : const Color(0xFF86EFAC),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Paid: ₹${billing.totalPaid.toStringAsFixed(0)} / ₹${billing.totalAnnualFee.toStringAsFixed(0)}',
                    style: const TextStyle(
                        color: Color(0xFFE2E8F0),
                        fontSize: 11,
                        fontWeight: FontWeight.w500),
                  ),
                  Text(
                    '${paidPct.toStringAsFixed(0)}% Settled',
                    style: const TextStyle(
                        color: Color(0xFF38BDF8),
                        fontSize: 11,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: paidPct / 100,
                  backgroundColor: const Color(0xFF334155),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    paidPct >= 80
                        ? const Color(0xFF4ADE80)
                        : const Color(0xFFFBBF24),
                  ),
                  minHeight: 6,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // Section: Pending & Upcoming
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'What Student Has To Pay',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.dangerLight,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${pending.length} Due Invoices',
                style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.danger),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        if (pending.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.successLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text('No pending dues.',
                style: TextStyle(color: AppColors.success, fontSize: 12)),
          )
        else
          ...pending.map((inv) => _PendingInvoiceItemView(invoice: inv)),

        if (paid.isNotEmpty) ...[
          const SizedBox(height: 18),
          const Text(
            'Complete Invoices & Payment Ledger',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          ...paid.map((inv) => _PaidInvoiceItemView(invoice: inv)),
        ],

        if (billing.feeStructure.isNotEmpty) ...[
          const SizedBox(height: 18),
          const Text(
            'Annual Fee Structure Breakdown',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  ...billing.feeStructure.map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              item.category,
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.textPrimary),
                            ),
                            Text(
                              '₹${item.amount.toStringAsFixed(0)} / ${item.frequency}',
                              style: const TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      )),
                  const Divider(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Annual Commitment',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '₹${billing.totalAnnualFee.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],

        if (canManageFees) ...[
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(phone.isEmpty
                            ? 'Guardian phone is not available.'
                            : 'SMS reminder requires the live messaging service.'),
                        backgroundColor: AppColors.primary,
                      ),
                    );
                  },
                  icon: const AppSvgIcon('bell',
                      size: 16, color: AppColors.primary),
                  label: const Text('SMS Reminder'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                            'Use Fee Desk invoices to record live payments.'),
                        backgroundColor: AppColors.primary,
                      ),
                    );
                  },
                  icon: const AppSvgIcon('receipt',
                      size: 16, color: Colors.white),
                  label: const Text('Collect / Pay'),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 16),
      ],
    );
  }
}

class _PendingInvoiceItemView extends StatelessWidget {
  final BillingInvoiceItem invoice;

  const _PendingInvoiceItemView({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final remaining = invoice.amount - invoice.paidAmount;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: const Color(0xFFFFFBEB),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFFED7AA)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const AppSvgIcon('receipt',
                        size: 14, color: Color(0xFFD97706)),
                    const SizedBox(width: 6),
                    Text(
                      invoice.monthYear,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: Color(0xFF92400E)),
                    ),
                  ],
                ),
                StatusBadge(
                  label: invoice.status,
                  type: invoice.status == 'PARTIAL'
                      ? StatusType.warning
                      : StatusType.danger,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(invoice.title,
                style: const TextStyle(fontSize: 11, color: Color(0xFF78350F))),
            const Divider(height: 14, color: Color(0xFFFDE68A)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Due: ${invoice.dueDate}',
                    style: const TextStyle(
                        fontSize: 11, color: Color(0xFF92400E))),
                Text(
                  'Remaining: ₹${remaining.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFFDC2626)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PaidInvoiceItemView extends StatelessWidget {
  final BillingInvoiceItem invoice;

  const _PaidInvoiceItemView({required this.invoice});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const AppSvgIcon('receipt',
                        size: 14, color: AppColors.success),
                    const SizedBox(width: 6),
                    Text(invoice.monthYear,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                const StatusBadge(label: 'PAID', type: StatusType.success),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${invoice.title} • Inv #${invoice.invoiceNumber}',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
            const Divider(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Paid: ${invoice.paidDate ?? invoice.dueDate}',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary),
                ),
                Text(
                  '₹${invoice.amount.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: AppColors.textPrimary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailStatBox extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;
  final Color bgColor;

  const _DetailStatBox({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w600, color: color)),
          const SizedBox(height: 2),
          Text(value,
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(subtitle,
              style: TextStyle(fontSize: 9, color: color.withOpacity(0.8))),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary),
          ),
        ),
      ],
    );
  }
}
