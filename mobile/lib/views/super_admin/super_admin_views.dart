import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/stat_card.dart';
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

class SuperAdminSchoolsView extends StatelessWidget {
  const SuperAdminSchoolsView({super.key});

  @override
  Widget build(BuildContext context) {
    return _FutureList(
      title: 'Schools',
      future: ApiClient.getSchools(),
      emptyText: 'No schools found.',
      itemBuilder: (school) => _InfoTile(
        icon: 'graduation_cap',
        title: '${school['name'] ?? 'Unnamed School'}',
        subtitle:
            '${school['code'] ?? 'No code'} • ${school['status'] ?? 'unknown'}',
      ),
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

class SuperAdminAccessRequestsView extends StatelessWidget {
  const SuperAdminAccessRequestsView({super.key});

  @override
  Widget build(BuildContext context) {
    return _FutureList(
      title: 'Access Requests',
      future: ApiClient.getAccessRequests(),
      emptyText: 'No access requests found.',
      itemBuilder: (request) {
        final profile =
            request['profiles'] is Map ? request['profiles'] as Map : const {};
        final school =
            request['schools'] is Map ? request['schools'] as Map : const {};
        return _InfoTile(
          icon: 'bell',
          title:
              '${profile['display_name'] ?? request['applicant_name'] ?? profile['email'] ?? 'Applicant'}',
          subtitle:
              '${school['name'] ?? 'Unknown school'} • ${request['status'] ?? 'pending'}',
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

  const _PlatformScaffold(
      {required this.title,
      required this.child,
      this.loading = false,
      this.error});

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
              if (loading)
                const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2)),
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
