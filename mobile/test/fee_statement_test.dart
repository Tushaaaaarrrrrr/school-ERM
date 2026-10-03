import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:gi_campus/data/models/fee_model.dart';
import 'package:gi_campus/viewmodels/student_viewmodel.dart';
import 'package:gi_campus/views/parent_student/student_fees_view.dart';

class FeeData extends StudentViewModel {
  @override
  List<FeeInvoiceModel> get invoices => [FeeInvoiceModel.fromJson({'id':'saved-invoice','student_id':'student','billing_month':'2026-08','final_amount':2000,'paid_amount':2000,'due_date':'2026-08-10','status':'paid'})];
  @override
  List<Map<String,dynamic>> get charges => [{'id':'charge','charge_name':'Exam Fee','amount':300,'paid_amount':0,'remaining_amount':300,'status':'pending'}];
}
void main() {
  testWidgets('paid tuition and pending charge remain distinct in fees', (tester) async {
    await tester.pumpWidget(ChangeNotifierProvider<StudentViewModel>(create: (_) => FeeData(), child: const MaterialApp(home: Scaffold(body: StudentFeesView()))));
    expect(find.text('₹300'), findsWidgets);
    await tester.ensureVisible(find.textContaining('Paid ₹2,000'));
    expect(find.textContaining('Paid ₹2,000'), findsOneWidget);
    expect(find.textContaining('Due ₹0'), findsOneWidget);
    expect(find.text('PAID'), findsOneWidget);
    await tester.ensureVisible(find.text('Exam Fee'));
    expect(find.text('Exam Fee'), findsOneWidget);
  });
}
