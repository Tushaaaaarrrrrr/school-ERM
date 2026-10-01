# Flutter specific rules
-keep class io.flutter.** { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**

# Keep entry points
-keep class com.gicampus.app.MainActivity { *; }

# Supabase / networking
-keep class io.github.jan.supabase.** { *; }
-dontwarn io.github.jan.supabase.**

# Google Sign-In
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Keep Kotlin metadata
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod
