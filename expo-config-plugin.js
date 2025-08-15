const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withMeowClickerConfig(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults;
    
    // Add internet permission for your game
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    androidManifest.manifest['uses-permission'].push({
      $: { 'android:name': 'android.permission.INTERNET' }
    });
    
    return config;
  });
};
