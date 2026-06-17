/**
 * Detox config. Submodule layout:
 *   zinga/Frontend/  ← Expo project
 *   Detox builds zinga/Frontend/ios/Zinga.xcworkspace (Zinga scheme)
 *   and zinga/Frontend/android (app module).
 *
 * Before first use:
 *   cd zinga/Frontend && npx expo prebuild --platform all --no-install
 *
 * Then run:
 *   npm run detox:build:ios
 *   npm run detox:test:ios
 */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'zinga/Frontend/ios/build/Build/Products/Debug-iphonesimulator/Zinga.app',
      build:
        'cd zinga/Frontend && xcodebuild -workspace ios/Zinga.xcworkspace -scheme Zinga -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS="arm64" EXCLUDED_ARCHS=x86_64',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'zinga/Frontend/ios/build/Build/Products/Release-iphonesimulator/Zinga.app',
      build:
        'cd zinga/Frontend && xcodebuild -workspace ios/Zinga.xcworkspace -scheme Zinga -configuration Release -sdk iphonesimulator -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS="arm64" EXCLUDED_ARCHS=x86_64',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath:
        'zinga/Frontend/android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath:
        'zinga/Frontend/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      // Target only the :app module's tasks to avoid the
      // `:expo-*:packageDebugAndroidTest` failures across library modules.
      build:
        'cd zinga/Frontend/android && ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath:
        'zinga/Frontend/android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd zinga/Frontend/android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 17' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_10_Pro' },
    },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
    'android.emu.release': { device: 'emulator', app: 'android.release' },
  },
};
