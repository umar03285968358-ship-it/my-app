const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Removes OneSignal's BootUpReceiver from the final merged manifest.
 *
 * The receiver comes from the OneSignal library's own manifest, which
 * Gradle merges at build time. A "tools:node=remove" entry tells the
 * manifest merger to drop it, which works even though the receiver is
 * not present in the app-level manifest.
 *
 * OneSignal still initializes normally when the user opens the app.
 */
function withRemoveOneSignalBootReceiver(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const application = manifest.application?.[0];
    if (!application) return config;

    const name = "com.onesignal.notifications.receivers.BootUpReceiver";

    application.receiver = (application.receiver || []).filter(
      (r) => r.$?.["android:name"] !== name,
    );

    application.receiver.push({
      $: {
        "android:name": name,
        "tools:node": "remove",
      },
    });

    return config;
  });
}

module.exports = withRemoveOneSignalBootReceiver;
