import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gi_campus/core/widgets/status_badge.dart';
import 'package:gi_campus/core/widgets/stat_card.dart';
import 'package:gi_campus/views/common/error_views.dart';

void main() {
  group('StatusBadge', () {
    testWidgets('renders label and dot indicator for all status types',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                StatusBadge(label: 'PAID', type: StatusType.success),
                StatusBadge(label: 'PENDING', type: StatusType.warning),
                StatusBadge(label: 'OVERDUE', type: StatusType.danger),
                StatusBadge(label: 'PARTIAL', type: StatusType.info),
                StatusBadge(label: 'NEUTRAL', type: StatusType.neutral),
              ],
            ),
          ),
        ),
      );

      expect(find.text('PAID'), findsOneWidget);
      expect(find.text('PENDING'), findsOneWidget);
      expect(find.text('OVERDUE'), findsOneWidget);
      expect(find.text('PARTIAL'), findsOneWidget);
      expect(find.text('NEUTRAL'), findsOneWidget);
    });
  });

  group('StatCard', () {
    testWidgets('renders title, bold value and subtitle', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatCard(
              title: 'Active Students',
              value: '1,240',
              subtitle: '98% enrollment rate',
              iconName: 'graduation_cap',
            ),
          ),
        ),
      );

      expect(find.text('Active Students'), findsOneWidget);
      expect(find.text('1,240'), findsOneWidget);
      expect(find.text('98% enrollment rate'), findsOneWidget);
    });
  });

  group('Common State Views', () {
    testWidgets('EmptyStateView renders title, message and triggers action',
        (tester) async {
      bool actionTriggered = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyStateView(
              title: 'No Notices Yet',
              message: 'Check back later for announcements.',
              actionLabel: 'Refresh',
              onAction: () => actionTriggered = true,
            ),
          ),
        ),
      );

      expect(find.text('No Notices Yet'), findsOneWidget);
      expect(find.text('Check back later for announcements.'), findsOneWidget);
      expect(find.text('Refresh'), findsOneWidget);

      await tester.tap(find.text('Refresh'));
      expect(actionTriggered, isTrue);
    });

    testWidgets('ErrorStateView renders error and triggers retry',
        (tester) async {
      bool retryTriggered = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorStateView(
              title: 'Failed to load records',
              message: 'Server timeout occurred.',
              onRetry: () => retryTriggered = true,
            ),
          ),
        ),
      );

      expect(find.text('Failed to load records'), findsOneWidget);
      expect(find.text('Server timeout occurred.'), findsOneWidget);
      expect(find.text('Try Again'), findsOneWidget);

      await tester.tap(find.text('Try Again'));
      expect(retryTriggered, isTrue);
    });

    testWidgets('LoadingSkeletonView renders skeleton rows without crash',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingSkeletonView(itemCount: 3),
          ),
        ),
      );

      expect(find.byType(SkeletonContainer), findsWidgets);
    });
  });
}
