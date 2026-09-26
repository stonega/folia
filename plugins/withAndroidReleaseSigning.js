const { withAppBuildGradle } = require('expo/config-plugins');

const signingConfig = `
        if (System.getenv('FOLIO_ANDROID_STORE_FILE')) {
            release {
                storeFile file(System.getenv('FOLIO_ANDROID_STORE_FILE'))
                storePassword System.getenv('FOLIO_ANDROID_STORE_PASSWORD')
                keyAlias System.getenv('FOLIO_ANDROID_KEY_ALIAS')
                keyPassword System.getenv('FOLIO_ANDROID_KEY_PASSWORD')
            }
        }`;

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        'Folio release signing requires a Groovy app/build.gradle',
      );
    }

    let contents = config.modResults.contents;
    if (contents.includes("System.getenv('FOLIO_ANDROID_STORE_FILE')")) {
      return config;
    }

    const signingStart = contents.indexOf('    signingConfigs {');
    const signingEnd = contents.indexOf(
      '\n    }\n    buildTypes {',
      signingStart,
    );
    if (signingStart < 0 || signingEnd < 0) {
      throw new Error(
        'Could not find Android signingConfigs in app/build.gradle',
      );
    }
    contents =
      contents.slice(0, signingEnd) +
      signingConfig +
      contents.slice(signingEnd);

    const buildTypesStart = contents.indexOf('    buildTypes {', signingEnd);
    const releaseStart = contents.indexOf('        release {', buildTypesStart);
    const releaseEnd = contents.indexOf('\n        }', releaseStart);
    const debugSigning = '            signingConfig signingConfigs.debug';
    const debugSigningIndex = contents.indexOf(debugSigning, releaseStart);
    if (
      releaseStart < 0 ||
      releaseEnd < 0 ||
      debugSigningIndex < 0 ||
      debugSigningIndex > releaseEnd
    ) {
      throw new Error('Could not find Android release signingConfig');
    }
    contents =
      contents.slice(0, debugSigningIndex) +
      "            signingConfig(System.getenv('FOLIO_ANDROID_STORE_FILE') ? signingConfigs.release : null)" +
      contents.slice(debugSigningIndex + debugSigning.length);

    config.modResults.contents = contents;
    return config;
  });
};
