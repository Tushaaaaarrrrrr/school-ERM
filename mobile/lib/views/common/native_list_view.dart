import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/api_client.dart';

typedef Rec = Map<String, dynamic>;

/// First non-empty value among [keys], as text.
String pick(Rec m, List<String> keys, [String fallback = '']) {
  for (final k in keys) {
    final v = m[k];
    if (v != null && v.toString().trim().isNotEmpty) return v.toString().trim();
  }
  return fallback;
}

String fullName(Rec m) {
  final n = '${m['first_name'] ?? ''} ${m['last_name'] ?? ''}'.trim();
  return n.isNotEmpty ? n : pick(m, ['name', 'full_name', 'user_name']);
}

String shortDate(String iso) => iso.length >= 10 ? iso.substring(0, 10) : iso;

BadgeType badgeFor(String status) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'paid':
    case 'present':
    case 'published':
    case 'admitted':
    case 'completed':
      return BadgeType.success;
    case 'pending':
    case 'partial':
    case 'new':
    case 'scheduled':
    case 'draft':
      return BadgeType.warning;
    case 'rejected':
    case 'inactive':
    case 'suspended':
    case 'absent':
    case 'failed':
    case 'cancelled':
      return BadgeType.danger;
    default:
      return BadgeType.neutral;
  }
}

/// A button shown on a row's detail sheet; calls the same API as the website.
class NativeAction {
  final String label;
  final Color color;
  final String? confirm;
  final bool Function(Rec) visible;
  final String method;
  final String Function(Rec) path;
  final Map<String, dynamic> Function(Rec) body;
  const NativeAction({
    required this.label,
    required this.method,
    required this.path,
    required this.body,
    this.color = AppColors.primary,
    this.confirm,
    this.visible = _always,
  });
  static bool _always(Rec _) => true;
}

class NativeListSpec {
  final String title;
  final String icon;
  final String path;
  final Map<String, String> query;
  final String Function(Rec) heading;
  final String Function(Rec) subtitle;
  final String Function(Rec)? status;
  final String Function(Rec)? trailing;
  final List<MapEntry<String, String>> Function(Rec) details;
  final List<NativeAction> actions;
  final String emptyText;
  const NativeListSpec({
    required this.title,
    required this.icon,
    required this.path,
    required this.heading,
    required this.subtitle,
    required this.details,
    this.query = const {},
    this.status,
    this.trailing,
    this.actions = const [],
    this.emptyText = 'Nothing here yet',
  });
}

/// Native, database-backed list screen. One implementation serves every
/// "directory / requests / history" page so the app never needs a WebView.
class NativeListView extends StatefulWidget {
  final NativeListSpec spec;
  const NativeListView({super.key, required this.spec});
  @override
  State<NativeListView> createState() => _NativeListViewState();
}

class _NativeListViewState extends State<NativeListView> {
  List<Rec> _rows = const [];
  String _q = '';
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final rows = await ApiClient.getList(widget.spec.path, widget.spec.query);
      if (mounted) setState(() => _rows = rows);
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _toast(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  Future<void> _run(NativeAction a, Rec row) async {
    if (a.confirm != null) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
          title: Text(a.label),
          content: Text(a.confirm!),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: const Text('Cancel')),
            FilledButton(
                style: FilledButton.styleFrom(backgroundColor: a.color),
                onPressed: () => Navigator.pop(c, true),
                child: Text(a.label)),
          ],
        ),
      );
      if (ok != true) return;
    }
    try {
      await ApiClient.send(a.method, a.path(row), a.body(row));
      if (!mounted) return;
      _toast('${a.label} done');
      await _load();
    } catch (e) {
      if (mounted) _toast(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _open(Rec row) {
    final spec = widget.spec;
    final acts = spec.actions.where((a) => a.visible(row)).toList();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheet) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.92,
        builder: (_, scroll) => ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Center(
              child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            Text(spec.heading(row),
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
            if (spec.status != null && spec.status!(row).isNotEmpty) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: StatusBadge(
                    text: spec.status!(row).toUpperCase(),
                    type: badgeFor(spec.status!(row))),
              ),
            ],
            const SizedBox(height: 12),
            for (final d in spec.details(row).where((e) => e.value.isNotEmpty))
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: Row2(label: d.key, value: d.value),
              ),
            if (acts.isNotEmpty) ...[
              const SizedBox(height: 16),
              Row(children: [
                for (final a in acts)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilledButton(
                        style:
                            FilledButton.styleFrom(backgroundColor: a.color),
                        onPressed: () {
                          Navigator.pop(sheet);
                          _run(a, row);
                        },
                        child: Text(a.label),
                      ),
                    ),
                  ),
              ]),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final spec = widget.spec;
    final q = _q.toLowerCase();
    final shown = q.isEmpty
        ? _rows
        : _rows
            .where((r) =>
                '${spec.heading(r)} ${spec.subtitle(r)} ${spec.status?.call(r) ?? ''}'
                    .toLowerCase()
                    .contains(q))
            .toList();

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Row(children: [
          Expanded(
            child: Text(spec.title,
                style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary)),
          ),
          if (!_loading && _error == null)
            StatusBadge(text: '${_rows.length} total', type: BadgeType.info),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: TextField(
          onChanged: (v) => setState(() => _q = v),
          decoration: InputDecoration(
            hintText: 'Search ${spec.title.toLowerCase()}',
            prefixIcon: const Icon(Icons.search, size: 20),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 0),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border)),
          ),
        ),
      ),
      const SizedBox(height: 8),
      Expanded(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _Message(
                    icon: Icons.cloud_off,
                    title: 'Could not load',
                    text: _error!,
                    onRetry: () {
                      setState(() => _loading = true);
                      _load();
                    })
                : RefreshIndicator(
                    onRefresh: _load,
                    child: shown.isEmpty
                        ? ListView(children: [
                            _Message(
                                icon: Icons.inbox_outlined,
                                title: q.isEmpty ? spec.emptyText : 'No matches',
                                text: q.isEmpty
                                    ? 'Pull down to refresh.'
                                    : 'Try a different search.')
                          ])
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: shown.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 8),
                            itemBuilder: (_, i) => _RowCard(
                                spec: spec,
                                row: shown[i],
                                onTap: () => _open(shown[i])),
                          ),
                  ),
      ),
    ]);
  }
}

class _RowCard extends StatelessWidget {
  final NativeListSpec spec;
  final Rec row;
  final VoidCallback onTap;
  const _RowCard({required this.spec, required this.row, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final heading = spec.heading(row);
    final status = spec.status?.call(row) ?? '';
    final trailing = spec.trailing?.call(row) ?? '';
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border)),
          child: Row(children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: heading.isEmpty
                  ? AppSvgIcon(spec.icon, size: 20, color: AppColors.primary)
                  : Text(heading[0].toUpperCase(),
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: AppColors.primary)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(heading.isEmpty ? '—' : heading,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: AppColors.textPrimary)),
                  const SizedBox(height: 3),
                  Text(spec.subtitle(row),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              if (status.isNotEmpty)
                StatusBadge(text: status.toUpperCase(), type: badgeFor(status)),
              if (trailing.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(trailing,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: AppColors.textPrimary)),
              ],
            ]),
          ]),
        ),
      ),
    );
  }
}

class Row2 extends StatelessWidget {
  final String label, value;
  const Row2({super.key, required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 120,
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary))),
        ],
      );
}

class _Message extends StatelessWidget {
  final IconData icon;
  final String title, text;
  final VoidCallback? onRetry;
  const _Message(
      {required this.icon,
      required this.title,
      required this.text,
      this.onRetry});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(40),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 44, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text(title,
              style:
                  const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 4),
          Text(text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary)),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ]),
      );
}
