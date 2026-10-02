import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gi_campus/core/widgets/user_avatar.dart';

void main() {
  test('UserAvatar.imageProviderOf resolves data URI to MemoryImage', () {
    const rawDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    final provider = UserAvatar.imageProviderOf(rawDataUrl);
    expect(provider, isNotNull);
    expect(provider, isA<MemoryImage>());
  });

  test('UserAvatar.imageProviderOf resolves http URL to NetworkImage', () {
    const httpUrl = 'https://example.com/photo.png';
    final provider = UserAvatar.imageProviderOf(httpUrl);
    expect(provider, isNotNull);
    expect(provider, isA<NetworkImage>());
  });

  test('UserAvatar.imageProviderOf returns null for invalid or empty inputs', () {
    expect(UserAvatar.imageProviderOf(null), isNull);
    expect(UserAvatar.imageProviderOf('   '), isNull);
    expect(UserAvatar.imageProviderOf('data:image/jpeg;base64,invalid-base-64!!!'), isNull);
  });
}
