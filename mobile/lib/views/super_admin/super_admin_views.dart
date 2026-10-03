import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/services/api_client.dart';

class SuperAdminOverviewView extends StatelessWidget {
  final Function(int)? onTabSelected;

  const SuperAdminOverviewView({super.key, this.onTabSelected});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_PlatformData>(
      future: _PlatformData.load(),
      builder: (context, snapshot) {
        final data = snapshot.data ?? const _PlatformData.empty();
        return _PlatformScaffold(
          title: 'Platform Overview',
          loading: snapshot.connectionState == ConnectionState.waiting,
          error: snapshot.error,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                      child: StatCard(
                          title: 'Schools',
                          value: '${data.schools.length}',
                          subtitle: '${data.activeSchools} active',
                          iconName: 'graduation_cap')),
                  const SizedBox(width: 12),
                  Expanded(
                      child: StatCard(
                          title: 'Users',
                          value: '${data.users.length}',
                          subtitle: '${data.activeUsers} active',
                          iconName: 'teacher')),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                      child: StatCard(
                          title: 'Requests',
                          value: '${data.pendingRequests}',
                          subtitle: 'Pending approval',
                          iconName: 'bell')),
                  const SizedBox(width: 12),
                  Expanded(
                      child: StatCard(
                          title: 'Security Logs',
                          value: '${data.events.length}',
                          subtitle: 'Latest activity',
                          iconName: 'shield_check')),
                ],
              ),
              const SizedBox(height: 20),
              const _SectionTitle('Super Admin Operations'),
              _ActionGrid(actions: [
                _ActionData('Schools', 'Create & manage schools',
                    'graduation_cap', () => onTabSelected?.call(1)),
                _ActionData('Users', 'Roles & access control', 'teacher',
                    () => onTabSelected?.call(2)),
                _ActionData('Requests', 'Approve school access', 'bell',
                    () => onTabSelected?.call(3)),
                _ActionData('Security', 'Audit login events', 'shield_check',
                    () => onTabSelected?.call(4)),
                _ActionData('Settings', 'Platform controls', 'sparkles',
                    () => onTabSelected?.call(5)),
              ]),
              const SizedBox(height: 20),
              const _SectionTitle('Recent Security Activity'),
              _ListCard(
                emptyText: 'No security events found.',
                children: data.events.take(5).map((event) {
                  return _InfoTile(
                    icon: 'shield_check',
                    title: '${event['event_type'] ?? 'event'}',
                    subtitle:
                        '${event['user_name'] ?? event['email'] ?? event['registration_identifier'] ?? 'Unknown'} • ${event['school_name'] ?? 'Platform'}',
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}

class SuperAdminSchoolsView extends StatefulWidget {
  const SuperAdminSchoolsView({super.key});

  @override
  State<SuperAdminSchoolsView> createState() => _SuperAdminSchoolsViewState();
}

class _SuperAdminSchoolsViewState extends State<SuperAdminSchoolsView> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      _future = ApiClient.getSchools();
    });
  }

  Future<void> _createSchool() async {
    final nameCtrl = TextEditingController();
    final codeCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    String? errorText;
    bool isSaving = false;

    await showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Create New School', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'School Name *', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: codeCtrl,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(labelText: 'School Code * (e.g. DPA-002)', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Admin Google Email *', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Contact Phone', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: addressCtrl,
                      decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()),
                    ),
                    if (errorText != null) ...[
                      const SizedBox(height: 8),
                      Text(errorText!, style: const TextStyle(color: AppColors.danger, fontSize: 12)),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.pop(dialogCtx),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final name = nameCtrl.text.trim();
                          final code = codeCtrl.text.trim().toUpperCase();
                          final email = emailCtrl.text.trim();
                          if (name.isEmpty || code.isEmpty || email.isEmpty) {
                            setDialogState(() => errorText = 'Name, Code, and Admin Email are required.');
                            return;
                          }
                          setDialogState(() {
                            isSaving = true;
                            errorText = null;
                          });
                          try {
                            await ApiClient.send('POST', '/api/schools', {
                              'name': name,
                              'code': code,
                              'admin_email': email,
                              if (phoneCtrl.text.trim().isNotEmpty) 'phone': phoneCtrl.text.trim(),
                              if (addressCtrl.text.trim().isNotEmpty) 'address': addressCtrl.text.trim(),
                              'status': 'active',
                            });
                            if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                            if (mounted) {
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                const SnackBar(content: Text('School created successfully!'), backgroundColor: AppColors.success),
                              );
                              _load();
                            }
                          } catch (e) {
                            setDialogState(() {
                              isSaving = false;
                              errorText = e.toString().replaceFirst('Exception: ', '');
                            });
                          }
                        },
                  child: isSaving
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Create School'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _toggleSchoolStatus(Map<String, dynamic> school) async {
    final id = school['id'];
    final name = school['name'] ?? 'School';
    final currentStatus = (school['status'] ?? 'active').toString().toLowerCase();
    final targetStatus = currentStatus == 'active' ? 'suspended' : 'active';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('${targetStatus == 'suspended' ? 'Suspend' : 'Activate'} $name?'),
        content: Text(
          targetStatus == 'suspended'
              ? 'Suspending this school will restrict access for users associated with this institution.'
              : 'Activating this school will restore normal operations for this institution.',
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: targetStatus == 'suspended' ? AppColors.danger : AppColors.success,
            ),
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: Text(targetStatus == 'suspended' ? 'Suspend' : 'Activate'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      try {
        await ApiClient.send('PATCH', '/api/schools/$id', {'status': targetStatus});
      } catch (_) {
        await ApiClient.send('PUT', '/api/schools/$id', {'status': targetStatus});
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$name is now $targetStatus.'),
            backgroundColor: targetStatus == 'active' ? AppColors.success : AppColors.warning,
          ),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update school: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snapshot) {
        final items = snapshot.data ?? const [];
        return _PlatformScaffold(
          title: 'Schools',
          action: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.add, size: 16),
            label: const Text('New School', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            onPressed: _createSchool,
          ),
          loading: snapshot.connectionState == ConnectionState.waiting,
          error: snapshot.error,
          child: _ListCard(
            emptyText: 'No schools found.',
            children: items.map((school) {
              final status = (school['status'] ?? 'unknown').toString().toLowerCase();
              final isActive = status == 'active';
              return ListTile(
                leading: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.primaryLight : AppColors.dangerLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: AppSvgIcon(
                    'graduation_cap',
                    size: 20,
                    color: isActive ? AppColors.primary : AppColors.danger,
                  ),
                ),
                title: Text(
                  '${school['name'] ?? 'Unnamed School'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
                subtitle: Text(
                  'Code: ${school['code'] ?? '—'} • Admin: ${school['admin_email'] ?? school['email'] ?? '—'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    StatusBadge(
                      label: status.toUpperCase(),
                      type: isActive ? BadgeType.success : BadgeType.warning,
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      icon: Icon(
                        isActive ? Icons.pause_circle_outline : Icons.play_circle_outline,
                        color: isActive ? AppColors.warning : AppColors.success,
                        size: 20,
                      ),
                      tooltip: isActive ? 'Suspend School' : 'Activate School',
                      onPressed: () => _toggleSchoolStatus(school),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

class SuperAdminUsersView extends StatelessWidget {
  const SuperAdminUsersView({super.key});

  @override
  Widget build(BuildContext context) {
    return _FutureList(
      title: 'Users & Roles',
      future: ApiClient.getUsers(),
      emptyText: 'No users found.',
      itemBuilder: (user) {
        final memberships = user['school_memberships'] as List? ?? const [];
        final active = memberships
            .where((item) => item is Map && item['status'] == 'active')
            .toList();
        final role = active.isNotEmpty ? active.first['role'] : user['role'];
        final school = active.isNotEmpty && active.first['schools'] is Map
            ? active.first['schools']['name']
            : 'Platform';
        return _InfoTile(
          icon: 'teacher',
          title: '${user['display_name'] ?? user['email'] ?? 'Unknown User'}',
          subtitle: '${role ?? 'unassigned'} • $school',
        );
      },
    );
  }
}

class SuperAdminAccessRequestsView extends StatefulWidget {
  const SuperAdminAccessRequestsView({super.key});

  @override
  State<SuperAdminAccessRequestsView> createState() => _SuperAdminAccessRequestsViewState();
}

class _SuperAdminAccessRequestsViewState extends State<SuperAdminAccessRequestsView> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    setState(() {
      _future = ApiClient.getAccessRequests();
    });
  }

  Future<void> _handleApprove(Map<String, dynamic> request) async {
    final profile = request['profiles'] is Map ? request['profiles'] as Map : const {};
    final school = request['schools'] is Map ? request['schools'] as Map : const {};
    final applicantName = profile['display_name'] ?? request['applicant_name'] ?? profile['email'] ?? 'Applicant';
    final schoolName = school['name'] ?? 'School';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Approve Access Request'),
        content: Text(
          'Grant school administrator access to $applicantName for $schoolName?',
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: const Text('Approve'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiClient.send('PATCH', '/api/access-requests', {
        'action': 'approve',
        'requestId': request['id'],
        'role': 'school_admin',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Access request for $applicantName approved.'),
            backgroundColor: AppColors.success,
          ),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to approve request: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  Future<void> _handleReject(Map<String, dynamic> request) async {
    final profile = request['profiles'] is Map ? request['profiles'] as Map : const {};
    final applicantName = profile['display_name'] ?? request['applicant_name'] ?? profile['email'] ?? 'Applicant';
    final reasonCtrl = TextEditingController(text: 'Rejected by administrator');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Reject Access Request'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to reject the access request from $applicantName?',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(
                labelText: 'Rejection Reason',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: const Text('Reject Request'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiClient.send('PATCH', '/api/access-requests', {
        'action': 'reject',
        'requestId': request['id'],
        'reason': reasonCtrl.text.trim().isNotEmpty ? reasonCtrl.text.trim() : 'Rejected by administrator',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Access request for $applicantName rejected.'),
            backgroundColor: AppColors.textPrimary,
          ),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to reject request: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snapshot) {
        final items = snapshot.data ?? const [];
        return _PlatformScaffold(
          title: 'Access Requests',
          loading: snapshot.connectionState == ConnectionState.waiting,
          error: snapshot.error,
          child: _ListCard(
            emptyText: 'No access requests found.',
            children: items.map((request) {
              final profile =
                  request['profiles'] is Map ? request['profiles'] as Map : const {};
              final school =
                  request['schools'] is Map ? request['schools'] as Map : const {};
              final status = (request['status'] ?? 'pending').toString().toLowerCase();
              final isPending = status == 'pending';
              final applicantName =
                  '${profile['display_name'] ?? request['applicant_name'] ?? profile['email'] ?? 'Applicant'}';

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: isPending ? AppColors.warningLight : AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          alignment: Alignment.center,
                          child: Icon(
                            Icons.person_outline,
                            size: 20,
                            color: isPending ? AppColors.warning : AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                applicantName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${school['name'] ?? 'Unknown school'} • ${profile['email'] ?? '—'}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        StatusBadge(
                          label: status.toUpperCase(),
                          type: status == 'approved'
                              ? BadgeType.success
                              : status == 'rejected'
                                  ? BadgeType.danger
                                  : BadgeType.warning,
                        ),
                      ],
                    ),
                    if (isPending) ...[
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              side: const BorderSide(color: AppColors.danger),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.close, size: 14, color: AppColors.danger),
                            label: const Text('Reject', style: TextStyle(color: AppColors.danger, fontSize: 12)),
                            onPressed: () => _handleReject(request),
                          ),
                          const SizedBox(width: 8),
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.success,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.check, size: 14),
                            label: const Text('Approve', style: TextStyle(fontSize: 12)),
                            onPressed: () => _handleApprove(request),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

class SuperAdminSecurityView extends StatelessWidget {
  const SuperAdminSecurityView({super.key});

  @override
  Widget build(BuildContext context) {
    return _FutureList(
      title: 'Security Logs',
      future: ApiClient.getAuthEvents(limit: 100),
      emptyText: 'No security logs found.',
      itemBuilder: (event) => _InfoTile(
        icon: 'shield_check',
        title: '${event['event_type'] ?? 'Event'}',
        subtitle:
            '${event['user_name'] ?? event['email'] ?? event['registration_identifier'] ?? 'Unknown'} • ${event['school_name'] ?? 'Platform'}',
      ),
    );
  }
}

class SuperAdminSettingsView extends StatelessWidget {
  const SuperAdminSettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return const _PlatformScaffold(
      title: 'Platform Settings',
      child: Column(
        children: [
          _InfoTile(
              icon: 'sparkles',
              title: 'School Provisioning',
              subtitle:
                  'Create schools, assign admins, and configure modules from the web console.'),
          Divider(height: 1),
          _InfoTile(
              icon: 'shield_check',
              title: 'Security Controls',
              subtitle:
                  'Manage roles, revoke access, and audit platform events.'),
          Divider(height: 1),
          _InfoTile(
              icon: 'bell',
              title: 'Access Workflow',
              subtitle: 'Review pending school access requests and approvals.'),
        ],
      ),
    );
  }
}

class _PlatformData {
  final List<Map<String, dynamic>> schools;
  final List<Map<String, dynamic>> users;
  final List<Map<String, dynamic>> requests;
  final List<Map<String, dynamic>> events;

  const _PlatformData(
      {required this.schools,
      required this.users,
      required this.requests,
      required this.events});
  const _PlatformData.empty()
      : this(
            schools: const [],
            users: const [],
            requests: const [],
            events: const []);

  int get activeSchools =>
      schools.where((school) => school['status'] == 'active').length;
  int get activeUsers =>
      users.where((user) => user['status'] == 'active').length;
  int get pendingRequests =>
      requests.where((request) => request['status'] == 'pending').length;

  static Future<_PlatformData> load() async {
    final results = await Future.wait([
      ApiClient.getSchools(),
      ApiClient.getUsers(),
      ApiClient.getAccessRequests(),
      ApiClient.getAuthEvents(limit: 25),
    ]);
    return _PlatformData(
        schools: results[0],
        users: results[1],
        requests: results[2],
        events: results[3]);
  }
}

class _FutureList extends StatelessWidget {
  final String title;
  final Future<List<Map<String, dynamic>>> future;
  final String emptyText;
  final Widget Function(Map<String, dynamic>) itemBuilder;

  const _FutureList(
      {required this.title,
      required this.future,
      required this.emptyText,
      required this.itemBuilder});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: future,
      builder: (context, snapshot) {
        final items = snapshot.data ?? const [];
        return _PlatformScaffold(
          title: title,
          loading: snapshot.connectionState == ConnectionState.waiting,
          error: snapshot.error,
          child: _ListCard(
              emptyText: emptyText, children: items.map(itemBuilder).toList()),
        );
      },
    );
  }
}

class _PlatformScaffold extends StatelessWidget {
  final String title;
  final Widget child;
  final bool loading;
  final Object? error;
  final Widget? action;

  const _PlatformScaffold(
      {required this.title,
      required this.child,
      this.loading = false,
      this.error,
      this.action});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Text(title,
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary))),
              if (action != null) action!,
              if (loading) ...[
                if (action != null) const SizedBox(width: 8),
                const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ],
          ),
          if (error != null) ...[
            const SizedBox(height: 12),
            Text('$error'.replaceFirst('Exception: ', ''),
                style: const TextStyle(color: AppColors.danger, fontSize: 12)),
          ],
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _ListCard extends StatelessWidget {
  final List<Widget> children;
  final String emptyText;

  const _ListCard({required this.children, required this.emptyText});

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) {
      return Card(
          child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(emptyText,
                  style: const TextStyle(color: AppColors.textSecondary))));
    }
    return Card(
        child: Column(
            children: children
                .expand((child) => [child, const Divider(height: 1)])
                .toList()
              ..removeLast()));
  }
}

class _InfoTile extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;

  const _InfoTile(
      {required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: AppSvgIcon(icon, size: 20, color: AppColors.primary),
      title: Text(title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
      subtitle: Text(subtitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title,
          style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary)),
    );
  }
}

class _ActionData {
  final String title;
  final String subtitle;
  final String icon;
  final VoidCallback onTap;

  const _ActionData(this.title, this.subtitle, this.icon, this.onTap);
}

class _ActionGrid extends StatelessWidget {
  final List<_ActionData> actions;

  const _ActionGrid({required this.actions});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: actions.map((action) {
        return SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 2,
          child: Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: action.onTap,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppSvgIcon(action.icon, size: 24, color: AppColors.primary),
                    const SizedBox(height: 10),
                    Text(action.title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 13)),
                    const SizedBox(height: 3),
                    Text(action.subtitle,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 10)),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
