const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
    packagerConfig: {
        asar: true,
        appBundleId: 'com.liuqingyuan.cheating-daddy-local-gpt',
        extendInfo: {
            NSMicrophoneUsageDescription: 'Use local Qwen ASR to transcribe Chinese and English audio.',
            NSAudioCaptureUsageDescription: 'Transcribe selected system audio locally.',
        },
        ignore: [/^\/work($|\/)/, /^\/tests($|\/)/, /^\/docs($|\/)/],
        extraResource: ['./src/assets/SystemAudioDump'],
        name: 'Cheating Daddy Local GPT',
        icon: 'src/assets/logo',
        // use `security find-identity -v -p codesigning` to find your identity
        // for macos signing
        // also fuck apple
        // osxSign: {
        //    identity: '<paste your identity here>',
        //   optionsForFile: (filePath) => {
        //       return {
        //           entitlements: 'entitlements.plist',
        //       };
        //   },
        // },
        // notarize if off cuz i ran this for 6 hours and it still didnt finish
        // osxNotarize: {
        //    appleId: 'your apple id',
        //    appleIdPassword: 'app specific password',
        //    teamId: 'your team id',
        // },
    },
    hooks: {
        postPackage: async (config, { platform, outputPaths }) => {
            if (platform !== 'darwin' || process.platform !== 'darwin') return;
            const execFile = require('node:util').promisify(require('node:child_process').execFile);
            for (const output of outputPaths) {
                const app = require('node:path').join(output, config.packagerConfig.name + '.app');
                await execFile('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', '--preserve-metadata=entitlements', app]);
                await execFile('/usr/bin/codesign', [
                    '--force',
                    '--sign',
                    '-',
                    '--identifier',
                    config.packagerConfig.appBundleId,
                    '--preserve-metadata=entitlements',
                    app,
                ]);
                await execFile('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
            }
        },
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'cheating-daddy',
                productName: 'Cheating Daddy',
                shortcutName: 'Cheating Daddy',
                createDesktopShortcut: true,
                createStartMenuShortcut: true,
            },
        },
        {
            name: '@electron-forge/maker-dmg',
            platforms: ['darwin'],
        },
        {
            name: '@reforged/maker-appimage',
            platforms: ['linux'],
            config: {
                options: {
                    name: 'Cheating Daddy',
                    productName: 'Cheating Daddy',
                    genericName: 'AI Assistant',
                    description: 'AI assistant for interviews and learning',
                    categories: ['Development', 'Education'],
                    icon: 'src/assets/logo.png',
                },
            },
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};
