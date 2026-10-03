import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';

// Reuse the web teacher workflows so permissions and actions stay identical.
class TeacherPortalView extends StatefulWidget {
  final String path;
  const TeacherPortalView({super.key, required this.path});
  @override
  State<TeacherPortalView> createState() => _TeacherPortalViewState();
}

class _TeacherPortalViewState extends State<TeacherPortalView> {
  WebViewController? _controller;
  Uri? _origin;
  String? _error;
  bool _loading = true;

  @override
  void initState() { super.initState(); _open(); }
  @override
  void didUpdateWidget(TeacherPortalView old) {
    super.didUpdateWidget(old);
    if (old.path != widget.path && _origin != null) _loadPath();
  }

  Future<void> _open() async {
    try {
      final user = context.read<AuthService>().currentUser;
      final origin = Uri.parse(await ApiClient.baseUrl);
      _origin = origin;
      final cookies = WebViewCookieManager();
      final session = jsonEncode({...user.toSessionJson(), 'name': user.name});
      // Android's cookie manager encodes the value; WebKit accepts it as supplied.
      final cookieValue = defaultTargetPlatform == TargetPlatform.android ? session : Uri.encodeComponent(session);
      await cookies.setCookie(WebViewCookie(name: 'school_erp_session', value: cookieValue, domain: origin.host, path: '/'));
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setUserAgent('GI Campus Mobile')
        ..setNavigationDelegate(NavigationDelegate(
          onNavigationRequest: (request) => Uri.tryParse(request.url)?.origin == origin.origin ? NavigationDecision.navigate : NavigationDecision.prevent,
          onPageStarted: (_) { if (mounted) setState(() { _loading = true; _error = null; }); },
          onPageFinished: (_) { if (mounted) setState(() => _loading = false); },
          onWebResourceError: (error) { if (error.isForMainFrame == true && mounted) setState(() { _error = 'Could not load the school portal. Please retry.'; _loading = false; }); },
        ));
      if (!mounted) return;
      setState(() => _controller = controller);
      await controller.loadRequest(origin.resolve('/mobile-portal').replace(queryParameters: {'path': widget.path}));
    } catch (_) {
      if (mounted) setState(() { _error = 'Could not open the school portal.'; _loading = false; });
    }
  }

  void _loadPath() => _controller?.loadRequest(_origin!.resolve(widget.path));

  @override
  Widget build(BuildContext context) => Column(children: [
    Row(children: [
      IconButton(tooltip: 'Back', icon: const Icon(Icons.arrow_back, size: 20), onPressed: () async { if (await _controller?.canGoBack() == true) await _controller?.goBack(); }),
      const Spacer(),
      IconButton(tooltip: 'Refresh', icon: const Icon(Icons.refresh, size: 20), onPressed: () { if (_error != null) { setState(() => _error = null); _loadPath(); } else { _controller?.reload(); } }),
    ]),
    if (_loading) const LinearProgressIndicator(),
    Expanded(child: _error != null
      ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text(_error!), TextButton(onPressed: _open, child: const Text('Retry'))]))
      : _controller == null ? const Center(child: CircularProgressIndicator()) : WebViewWidget(controller: _controller!)),
  ]);
}
