# GI Campus - Android Keystore Fingerprints & Credentials

Saved on: October 1, 2026
Package Name: `com.gicampus.app`

---

## 1. Debug (Local Development & Emulator)

Used automatically by `flutter run`.

- **Keystore Path**: `~/.android/debug.keystore`
- **Alias**: `AndroidDebugKey`
- **Store Password**: `android`
- **Key Password**: `android`
- **MD5**: `DE:F4:36:C9:7A:38:30:24:D6:F7:82:35:FB:28:73:AC`
- **SHA-1**: `9C:5D:8E:D9:13:C2:37:94:56:72:BB:BE:90:66:61:0E:1F:11:32:CC`
- **SHA-256**: `CC:F4:89:CE:47:29:9F:EA:E6:6E:80:A5:DD:4C:C2:66:2F:6B:76:6A:44:88:DE:B2:0C:B2:E7:2C:2E:3C:22:39`
- **Valid Until**: July 6, 2056

---

## 2. Release (Google Play Store & Production Builds)

Used by `flutter build appbundle --release` and `flutter build apk --release`.

- **Keystore Path**: `mobile/android/app/upload-keystore.jks`
- **Config File**: `mobile/android/key.properties`
- **Alias**: `upload`
- **Store Password**: `gicampus2026`
- **Key Password**: `gicampus2026`
- **MD5**: `62:97:48:C4:B1:D3:AF:A0:B5:46:EA:14:52:05:98:60`
- **SHA-1**: `3A:5C:76:70:04:E9:4F:8B:AB:18:04:A6:1F:CC:DF:50:18:BB:37:7B`
- **SHA-256**: `18:6E:15:A1:4F:5A:BF:20:FD:71:81:27:02:8D:0F:21:7B:63:32:A7:CF:AB:46:13:BD:87:D2:56:3B:D5:63:A4`
- **Valid Until**: February 16, 2054

---

## 3. Google Play App Signing Key (Production Distribution)

Managed by Google Play Console automatically.

- **SHA-256**: `B0:0D:37:FF:27:37:82:4A:81:F1:53:B0:5B:A1:1E:7E:3F:1C:21:98:31:52:99:E0:27:E6:69:AA:88:76:6C:E4`

---

## 4. Google OAuth & Firebase Config

- **Package Name**: `com.gicampus.app`
- **Web Client ID**: `990282572765-bn1ls79tuhpa589eiici5r9mr6c98c8h.apps.googleusercontent.com`
- **Add to Firebase / Google Cloud Console**:
  - Add Android OAuth Client ID for Debug using the **Debug SHA-1**.
  - Add Android OAuth Client ID for Release using the **Release SHA-1**.
  - (Optional) For Play Store installed apps, also add OAuth Client ID for **Google Play App Signing SHA-1**.
