const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Ensures the AndroidManifest.xml <queries> block includes
 * DIAL and VIEW intents for the "tel:" scheme.
 *
 * Without this, Linking.canOpenURL("tel:...") returns false
 * on Android 11+ (API 30+) due to package visibility restrictions,
 * and tapping "Call Customer" silently does nothing.
 */
function withTelQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [{}];
    }

    if (!manifest.queries[0].intent) {
      manifest.queries[0].intent = [];
    }

    const hasTelDial = manifest.queries[0].intent.some(
      (i) =>
        i.action?.[0]?.$?.["android:name"] === "android.intent.action.DIAL",
    );

    const hasTelView = manifest.queries[0].intent.some(
      (i) =>
        i.action?.[0]?.$?.["android:name"] === "android.intent.action.VIEW" &&
        i.data?.[0]?.$?.["android:scheme"] === "tel",
    );

    if (!hasTelDial) {
      manifest.queries[0].intent.push({
        action: [{ $: { "android:name": "android.intent.action.DIAL" } }],
        data: [{ $: { "android:scheme": "tel" } }],
      });
    }

    if (!hasTelView) {
      manifest.queries[0].intent.push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": "tel" } }],
      });
    }

    return config;
  });
}

module.exports = withTelQueries;
