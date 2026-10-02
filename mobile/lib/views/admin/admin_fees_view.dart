import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/fee_model.dart';
import '../../data/models/student_model.dart';
import '../../data/services/api_client.dart';

class AdminFeesView extends StatefulWidget {
  const AdminFeesView({super.key});

  @override
  State<AdminFeesView> createState() => _AdminFeesViewState();
}

class _AdminFeesViewState extends State<AdminFeesView> {
  late Future<List<FeeInvoiceModel>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.getFeeInvoices();
  }

  void _refresh() {
    setState(() => _future = ApiClient.getFeeInvoices());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<FeeInvoiceModel>>(
      future: _future,
      builder: (context, snapshot) {
        final invoices = snapshot.data ?? const <FeeInvoiceModel>[];
        final paid =
            invoices.fold<double>(0, (sum, item) => sum + item.paidAmount);
        final pending =
            invoices.fold<double>(0, (sum, item) => sum + item.dueBalance);

        return RefreshIndicator(
          onRefresh: () async => _refresh(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (snapshot.connectionState == ConnectionState.waiting)
                const LinearProgressIndicator(minHeight: 2),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      title: 'Collected',
                      value: '₹${paid.toStringAsFixed(0)}',
                      subtitle: 'Live invoice payments',
                      iconName: 'receipt',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StatCard(
                      title: 'Pending',
                      value: '₹${pending.toStringAsFixed(0)}',
                      subtitle: 'Outstanding balance',
                      iconName: 'calendar',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _showInvoiceSheet(context),
                      icon: const Icon(Icons.receipt_long),
                      label: const Text('Generate Invoice'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'Fee Invoices',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              if (invoices.isEmpty)
                const _EmptyFees()
              else
                Card(
                  child: Column(
                    children: invoices
                        .map((invoice) => ListTile(
                              title: Text(
                                invoice.invoiceNumber.isEmpty
                                    ? 'Invoice'
                                    : invoice.invoiceNumber,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              subtitle: Text(
                                invoice.month.isEmpty
                                    ? 'Due ${invoice.dueDate.toLocal().toString().split(' ').first}'
                                    : invoice.month,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textMuted,
                                ),
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹${invoice.amount.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  _status(invoice.status),
                                ],
                              ),
                            ))
                        .expand((child) => [child, const Divider(height: 1)])
                        .toList()
                      ..removeLast(),
                  ),
                ),
            ],
          ),
        ),
      );
    },
    );
  }

  void _showInvoiceSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const Padding(
        padding: EdgeInsets.all(20),
        child: _InvoiceForm(),
      ),
    ).then((saved) {
      if (saved == true) _refresh();
    });
  }

  static StatusBadge _status(FeeInvoiceStatus status) {
    switch (status) {
      case FeeInvoiceStatus.paid:
        return const StatusBadge(label: 'PAID', type: StatusType.success);
      case FeeInvoiceStatus.partial:
        return const StatusBadge(label: 'PARTIAL', type: StatusType.info);
      case FeeInvoiceStatus.overdue:
        return const StatusBadge(label: 'OVERDUE', type: StatusType.danger);
      case FeeInvoiceStatus.pending:
        return const StatusBadge(label: 'PENDING', type: StatusType.warning);
    }
  }
}

class _InvoiceForm extends StatefulWidget {
  const _InvoiceForm();

  @override
  State<_InvoiceForm> createState() => _InvoiceFormState();
}

class _InvoiceFormState extends State<_InvoiceForm> {
  final _amount = TextEditingController();
  List<StudentModel> _students = const [];
  List<Map<String, dynamic>> _years = const [];
  String _studentId = '';
  String _yearId = '';
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final students = await ApiClient.getStudents();
      final years = await ApiClient.getAcademicYears();
      if (!mounted) return;
      setState(() {
        _students = students;
        _years = years;
        _studentId = students.isNotEmpty ? students.first.id : '';
        _yearId = years.isNotEmpty ? '${years.first['id'] ?? ''}' : '';
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.createFeeInvoice(
        studentId: _studentId,
        academicYearId: _yearId,
        amount: double.tryParse(_amount.text) ?? 0,
        billingMonth: DateTime(DateTime.now().year, DateTime.now().month, 1),
        dueDate: DateTime.now().add(const Duration(days: 15)),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Generate Invoice',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 14),
        if (_loading) const LinearProgressIndicator(minHeight: 2),
        if (!_loading && (_students.isEmpty || _years.isEmpty))
          const Text(
            'Students and academic year must exist before generating invoices.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        if (!_loading && _students.isNotEmpty) ...[
          DropdownButtonFormField<String>(
            value: _studentId,
            decoration: const InputDecoration(labelText: 'Student'),
            items: _students
                .map((student) => DropdownMenuItem(
                      value: student.id,
                      child: Text(student.fullName.isEmpty
                          ? student.admissionNumber
                          : student.fullName),
                    ))
                .toList(),
            onChanged: (value) => setState(() => _studentId = value ?? ''),
          ),
          const SizedBox(height: 10),
        ],
        if (!_loading && _years.isNotEmpty) ...[
          DropdownButtonFormField<String>(
            value: _yearId,
            decoration: const InputDecoration(labelText: 'Academic year'),
            items: _years
                .map((year) => DropdownMenuItem(
                      value: '${year['id'] ?? ''}',
                      child: Text('${year['name'] ?? year['label'] ?? year['year'] ?? year['id']}'),
                    ))
                .toList(),
            onChanged: (value) => setState(() => _yearId = value ?? ''),
          ),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 10),
        TextField(
          controller: _amount,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(labelText: 'Amount'),
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _saving ||
                    _studentId.isEmpty ||
                    _yearId.isEmpty ||
                    (double.tryParse(_amount.text) ?? 0) <= 0
                ? null
                : _save,
            child: Text(_saving ? 'Saving...' : 'Save Invoice'),
          ),
        ),
      ],
    );
  }
}

class _EmptyFees extends StatelessWidget {
  const _EmptyFees();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: Text(
            'No fee invoices returned by the server yet.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
    );
  }
}
