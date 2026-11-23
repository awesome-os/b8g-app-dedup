/**
 * Standalone dataset for classifying software installation paths across 3 heads:
 *   - installScope: admin-system | user-local | pkg-manager | portable-backup
 *   - bloatKind:    clean-native | electron-chromium-dup | cache-build-bloat | installer-leftover
 *   - action:       keep-canonical | dedup-duplicate | purge-bloat | review-human
 *
 * Erasable TypeScript (erasableSyntaxOnly: true), zero external dependencies.
 */

export const PATH_HEAD_LABELS = {
  installScope: [
    'admin-system',
    'user-local',
    'pkg-manager',
    'portable-backup',
  ] as const,
  bloatKind: [
    'clean-native',
    'electron-chromium-dup',
    'cache-build-bloat',
    'installer-leftover',
  ] as const,
  action: [
    'keep-canonical',
    'dedup-duplicate',
    'purge-bloat',
    'review-human',
  ] as const,
} as const;

export type PathHeadName = keyof typeof PATH_HEAD_LABELS;
export type InstallScopeLabel = (typeof PATH_HEAD_LABELS.installScope)[number];
export type BloatKindLabel = (typeof PATH_HEAD_LABELS.bloatKind)[number];
export type ActionLabel = (typeof PATH_HEAD_LABELS.action)[number];

export interface PathSample {
  readonly path: string;
  readonly installScope: InstallScopeLabel;
  readonly bloatKind: BloatKindLabel;
  readonly action: ActionLabel;
}

/**
 * 180 diverse realistic Windows / Linux / macOS training paths spanning
 * every class of all 3 heads.
 */
export const PATH_TRAIN_SAMPLES: readonly PathSample[] = [
  // =========================================================================
  // 1. admin-system — clean-native -> keep-canonical (15)
  // =========================================================================
  {
    path: 'C:\\Program Files\\Git\\cmd\\git.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\7-Zip\\7z.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\Notepad++\\notepad++.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\GIMP 2\\bin\\gimp-2.10.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files (x86)\\PuTTY\\putty.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files (x86)\\WinSCP\\WinSCP.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\KeePassXC\\KeePassXC.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/opt/blender/blender',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/usr/bin/ffmpeg',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/usr/local/bin/ripgrep',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/Applications/VLC.app/Contents/MacOS/VLC',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },

  // =========================================================================
  // 2. admin-system — electron-chromium-dup -> dedup-duplicate (11)
  // =========================================================================
  {
    path: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Microsoft VS Code\\resources\\app.asar',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Slack\\slack.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Notion\\Notion.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Obsidian\\Obsidian.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Postman\\Postman.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Signal\\Signal.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/opt/visual-studio-code/resources/app.asar',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/opt/discord/Discord',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/opt/slack/chrome_100_percent.pak',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/Applications/Slack.app/Contents/Frameworks/Electron Framework.framework/Electron Framework',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },

  // =========================================================================
  // 3. admin-system — cache-build-bloat -> purge-bloat (9)
  // =========================================================================
  {
    path: 'C:\\ProgramData\\Microsoft\\Windows\\Caches\\GPUCache\\data_0',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Program Files\\Microsoft VS Code\\resources\\app\\node_modules\\@vscode\\ripgrep\\bin\\rg.exe',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\NVIDIA Corporation\\NV_Cache\\ShaderCache\\shader.bin',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Program Files\\Docker\\Docker\\resources\\GPUCache\\index',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\Oracle\\Java\\javapath\\Code Cache\\js\\cache.dat',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/var/cache/fontconfig/8f02d4cb045bd6ce15663e43f647c97e-le64.cache-7',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/opt/build-agent/workspace/target/debug/deps/libcore.rlib',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/Library/Caches/com.apple.iconservices.store/GPUCache/data_1',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Windows\\SoftwareDistribution\\Download\\Cache\\Cache_Data\\f_00001a',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 4. admin-system — installer-leftover -> purge-bloat (10)
  // =========================================================================
  {
    path: 'C:\\ProgramData\\Package Cache\\{A2C4F112-8B10-4D3A-9F21-7712A3E9B001}v14.38\\VC_redist.x64.exe',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\Package Cache\\{91F32B00-3C77-4120-B812-001122334455}\\dotnet-sdk-8.0-Setup.exe',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Windows\\Installer\\1a2b3c4d.msi',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Program Files (x86)\\InstallShield Installation Information\\{B4109921-1122-3344}\\setup.exe',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\NVIDIA Corporation\\Downloader\\latest\\560.94-desktop-win10-win11-installer.exe',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\Downloaded Installations\\{44AA11BB}\\AppSetup.msi',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Program Files\\Common Files\\Adobe\\Installers\\AdobeSetup.exe',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/var/cache/apt/archives/code_1.93.0_amd64.deb',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/Library/Updates/052-41291/InstallAssistant.pkg',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\Package Cache\\{77E11C09-5501-4E22}\\SQLServerInstaller.msi',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 5. user-local — clean-native -> keep-canonical (11)
  // =========================================================================
  {
    path: 'C:\\Users\\alice\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\frank\\AppData\\Local\\Programs\\SumatraPDF\\SumatraPDF.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\dev\\AppData\\Local\\Programs\\Git\\bin\\git.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\sarah\\AppData\\Local\\Programs\\Everything\\Everything.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\john\\AppData\\Local\\Programs\\WezTerm\\wezterm-gui.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\emma\\AppData\\Local\\Programs\\Alacritty\\alacritty.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/home/alex/.local/bin/nvim',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/home/dev/.local/share/applications/inkscape/bin/inkscape',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '~/.local/share/zig/zig',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '~/.local/bin/fd',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/Users/claire/Applications/iTerm.app/Contents/MacOS/iTerm2',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },

  // =========================================================================
  // 6. user-local — electron-chromium-dup -> dedup-duplicate (13)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\frank\\AppData\\Local\\Discord\\app-1.0.9165\\Discord.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\alice\\AppData\\Local\\slack\\app-4.40.128\\slack.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\bob\\AppData\\Local\\Microsoft\\Teams\\current\\Teams.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\sarah\\AppData\\Local\\Programs\\Notion\\Notion.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\dev\\AppData\\Local\\Obsidian\\Obsidian.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\john\\AppData\\Local\\Postman\\app-11.14.0\\Postman.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\emma\\AppData\\Roaming\\Spotify\\Spotify.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\frank\\AppData\\Local\\Programs\\cursor\\Cursor.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\alice\\AppData\\Local\\GitHubDesktop\\app-3.4.5\\GitHubDesktop.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\dev\\AppData\\Local\\Figma\\app-124.4.5\\resources\\app.asar',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/home/alex/.local/share/Discord/resources/app.asar',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/Users/claire/Library/Application Support/Notion/icudtl.dat',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },

  // =========================================================================
  // 7. user-local — cache-build-bloat -> purge-bloat (11)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\AppData\\Roaming\\Code\\GPUCache\\data_1',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\alice\\AppData\\Roaming\\discord\\Code Cache\\js\\8c91a0f2_0',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\dev\\AppData\\Roaming\\Slack\\Cache\\Cache_Data\\data_3',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\bob\\projects\\webapp\\node_modules\\webpack\\lib\\index.js',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\frank\\src\\rust-app\\target\\debug\\incremental\\app\\s-1234.bin',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\sarah\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Code Cache\\wasm\\index',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\emma\\AppData\\Local\\pip\\cache\\http-v2\\a1\\b2\\wheel.whl',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/home/alex/.cache/chromium/Default/GPUCache/data_0',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/home/dev/work/api-server/node_modules/typescript/lib/tsc.js',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '~/.gradle/caches/modules-2/files-2.1/org.jetbrains.kotlin/kotlin-stdlib.jar',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/Users/claire/Library/Developer/Xcode/DerivedData/MyApp-abc/Build/Intermediates.noindex/obj.o',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 8. user-local — installer-leftover -> purge-bloat (10)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\Downloads\\VSCodeUserSetup-x64-1.94.0.exe',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\alice\\Downloads\\DiscordSetup.exe',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\bob\\Downloads\\node-v22.9.0-x64.msi',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\sarah\\AppData\\Local\\SquirrelTemp\\tempb\\Slack-4.40.128-full.nupkg',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\dev\\AppData\\Local\\SquirrelTemp\\SquirrelSetup.log',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\john\\AppData\\Local\\Discord\\packages\\Discord-1.0.9165-full.nupkg',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\emma\\AppData\\Local\\Temp\\ChromeInstaller_129\\setup.exe',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\frank\\Downloads\\Git-2.46.2-64-bit-Setup.exe',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/Users/claire/Downloads/Docker-Desktop-4.34.dmg',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/home/alex/Downloads/zoom_amd64_installer.deb',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 9. pkg-manager — clean-native -> keep-canonical (15)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\scoop\\apps\\ripgrep\\current\\rg.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\alice\\scoop\\apps\\jq\\1.7.1\\jq.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\dev\\scoop\\apps\\zig\\current\\zig.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\7zip\\tools\\7z.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\cmake\\tools\\cmake.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\frank\\.cargo\\bin\\bat.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\dev\\.cargo\\bin\\cargo-nextest.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\alice\\AppData\\Local\\pnpm\\global\\5\\bin\\biome.cmd',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\WindowsApps\\Microsoft.WindowsTerminal_1.21.2361.0_x64__8wekyb3d8bbwe\\wt.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\WindowsApps\\Microsoft.PowerToys_0.84.0.0_x64__8wekyb3d8bbwe\\PowerToys.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\bob\\AppData\\Local\\Microsoft\\WinGet\\Packages\\ajeetdsouza.zoxide_Microsoft.Winget.Source\\zoxide.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/opt/homebrew/Cellar/ffmpeg/7.0.2/bin/ffmpeg',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/home/linuxbrew/.linuxbrew/Cellar/gh/2.56.0/bin/gh',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/home/alex/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/rustc',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/snap/firefox/current/usr/lib/firefox/firefox',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },

  // =========================================================================
  // 10. pkg-manager — electron-chromium-dup -> dedup-duplicate (10)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\scoop\\apps\\vscode\\current\\Code.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\alice\\scoop\\apps\\obsidian\\current\\Obsidian.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\dev\\scoop\\apps\\postman\\current\\Postman.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\discord\\tools\\Discord.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\slack\\tools\\slack.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\WindowsApps\\SpotifyAB.SpotifyMusic_1.245.454.0_x64__zpdnekdrzrea0\\Spotify.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\WindowsApps\\MSTeams_24231.512.3106.6573_x64__8wekyb3d8bbwe\\ms-teams.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/var/lib/flatpak/app/com.discordapp.Discord/current/active/files/discord/resources/app.asar',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/var/lib/flatpak/app/com.slack.Slack/current/active/files/extra/chrome_100_percent.pak',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/snap/code/current/usr/share/code/resources/app.asar',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },

  // =========================================================================
  // 11. pkg-manager — cache-build-bloat -> purge-bloat (10)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\AppData\\Local\\pnpm\\store\\v3\\files\\ab\\cdef012345',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\alice\\AppData\\Local\\pnpm\\global\\5\\node_modules\\eslint\\lib\\api.js',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\dev\\.cargo\\registry\\cache\\index.crates.io-6f17d22bba15001f\\serde-1.0.210.crate',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\bob\\AppData\\Local\\npm-cache\\_cacache\\content-v2\\sha512\\aa\\bb\\cc',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\sarah\\.nuget\\packages\\newtonsoft.json\\13.0.3\\lib\\net6.0\\Newtonsoft.Json.dll',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\frank\\scoop\\apps\\vscode\\current\\data\\user-data\\GPUCache\\data_0',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\nodejs\\tools\\node_modules\\npm\\index.js',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/opt/homebrew/Caches/downloads/a1b2c3--llvm-18.1.8.bottle.tar.gz',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/home/alex/.nvm/versions/node/v22.9.0/lib/node_modules/corepack/dist/corepack.js',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/var/lib/flatpak/repo/objects/ab/1234567890.filez.cache',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 12. pkg-manager — installer-leftover -> purge-bloat (10)
  // =========================================================================
  {
    path: 'C:\\Users\\frank\\scoop\\cache\\git#2.46.2#https_github.com_git-for-windows_Setup.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\alice\\scoop\\cache\\nodejs-lts#20.17.0#node-v20.17.0-x64.msi',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\firefox\\tools\\FirefoxSetup.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\choco-cache\\python3\\python-3.12.6-amd64-installer.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\dev\\AppData\\Local\\Temp\\WinGet\\Microsoft.VisualStudioCode.1.94.0\\VSCodeUserSetup.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\bob\\scoop\\cache\\vlc#3.0.21#vlc-3.0.21-win64-setup.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\git.install\\tools\\Git-2.46.0-Setup.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\sarah\\scoop\\cache\\7zip#24.08#7z2408-x64.msi',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/opt/homebrew/Caskroom/docker/4.34.0/Docker.dmg',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\john\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Docker.DockerDesktop\\DockerDesktopInstaller.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 13. portable-backup — clean-native -> review-human (18)
  // =========================================================================
  {
    path: 'D:\\Tools\\Sysinternals\\procexp64.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Tools\\ffmpeg\\bin\\ffmpeg.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Tools\\Notepad++Portable\\notepad++.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Portable\\7-ZipPortable\\App\\7-Zip64\\7z.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Portable\\KeePassPortable\\KeePass.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'E:\\OldPC_Backup\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'E:\\OldPC_Backup\\Program Files\\Git\\cmd\\git.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'E:\\OldPC_Backup\\Tools\\putty.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'F:\\DiskCopy_2022\\Program Files\\Blender Foundation\\Blender 3.6\\blender.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'F:\\DiskCopy_2022\\Program Files\\GIMP 2\\bin\\gimp-2.10.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\frank\\Tools\\winscp.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'G:\\Archive_Laptop\\Software\\SumatraPDF\\SumatraPDF.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Software_Backup\\Audacity\\audacity.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'E:\\Win10_Clone\\Program Files\\Mozilla Firefox\\firefox.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: '/mnt/backup/old-workstation/usr/local/bin/tmux',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: '/media/usb/portable/tools/jq',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: '/Volumes/OldMacHD/Applications/VLC.app/Contents/MacOS/VLC',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Tools\\Everything-Portable\\Everything.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },

  // =========================================================================
  // 14. portable-backup — electron-chromium-dup -> dedup-duplicate (9)
  // =========================================================================
  {
    path: 'D:\\Tools\\VSCode-Portable\\Code.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'D:\\Portable\\ObsidianPortable\\Obsidian.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'E:\\OldPC_Backup\\Users\\frank\\AppData\\Local\\Discord\\app-1.0.9012\\Discord.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'E:\\OldPC_Backup\\Users\\frank\\AppData\\Local\\slack\\app-4.32.122\\slack.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'F:\\DiskCopy_2022\\Program Files\\Microsoft VS Code\\resources\\app.asar',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\frank\\AppData\\Roaming\\Spotify\\Spotify.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'G:\\Archive_Laptop\\Apps\\Postman\\Postman.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/Volumes/OldMacHD/Applications/Notion.app/Contents/Resources/app.asar',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'E:\\Win10_Clone\\Users\\admin\\AppData\\Local\\Microsoft\\Teams\\current\\Teams.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },

  // =========================================================================
  // 15. portable-backup — cache-build-bloat -> purge-bloat (9)
  // =========================================================================
  {
    path: 'E:\\OldPC_Backup\\Users\\frank\\projects\\legacy-web\\node_modules\\lodash\\lodash.js',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'E:\\OldPC_Backup\\Users\\frank\\AppData\\Roaming\\Code\\GPUCache\\data_2',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'F:\\DiskCopy_2022\\src\\rust-cli\\target\\debug\\build\\serde\\out.o',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\frank\\AppData\\Roaming\\discord\\Code Cache\\js\\index',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'D:\\Tools\\VSCode-Portable\\data\\user-data\\GPUCache\\data_0',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'G:\\Archive_Laptop\\dev\\frontend\\node_modules\\react\\index.js',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/mnt/backup/old-workstation/home/dev/.cache/pip/http/cache.bin',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'E:\\Win10_Clone\\Users\\admin\\AppData\\Local\\Temp\\ShaderCache\\dx12.cache',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'D:\\Software_Backup\\rust-old\\target\\debug\\deps\\libtokio.rlib',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },

  // =========================================================================
  // 16. portable-backup — installer-leftover -> purge-bloat (9)
  // =========================================================================
  {
    path: 'E:\\OldPC_Backup\\Users\\frank\\Downloads\\VSCodeSetup-x64-1.80.0.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\frank\\Downloads\\python-3.10.8-amd64-installer.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'D:\\Software_Backup\\Installers\\Blender-3.6.5-windows-x64.msi',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'G:\\Archive_Laptop\\Downloads\\DiscordSetup.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'E:\\OldPC_Backup\\ProgramData\\Package Cache\\{5512AA00}\\vcredist_x64.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\frank\\AppData\\Local\\SquirrelTemp\\Slack-4.29-full.nupkg',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'D:\\Tools\\Installers\\Git-2.42.0-64-bit-Setup.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/Volumes/OldMacHD/Users/frank/Downloads/Firefox-118.0.dmg',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: '/mnt/backup/installers/VLC-3.0.18-Setup.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
];

/**
 * 56 strictly disjoint held-out validation paths covering every class of all 3 heads.
 * Zero paths overlap with PATH_TRAIN_SAMPLES.
 */
export const PATH_VAL_SAMPLES: readonly PathSample[] = [
  // =========================================================================
  // admin-system (14)
  // =========================================================================
  {
    path: 'C:\\Program Files\\Inkscape\\bin\\inkscape.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\Audacity\\Audacity.exe',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/opt/libreoffice/program/soffice.bin',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/Applications/Firefox.app/Contents/MacOS/firefox',
    installScope: 'admin-system',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\Discord\\Discord.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\Spotify\\Spotify.exe',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/opt/obsidian/resources/app.asar',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/Applications/Discord.app/Contents/Resources/app.asar',
    installScope: 'admin-system',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\ProgramData\\Microsoft\\EdgeUpdate\\GPUCache\\data_2',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Program Files\\Slack\\resources\\app\\node_modules\\electron\\index.js',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/opt/ci-runner/builds/service/target/debug/deps/libhttp.rlib',
    installScope: 'admin-system',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\Package Cache\\{88CC2211-9012-4F44}\\NodeJS-Setup.msi',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Windows\\Installer\\9f8e7d6c.msi',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Program Files (x86)\\InstallShield Installation Information\\{CC009911}\\Installer.exe',
    installScope: 'admin-system',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },

  // =========================================================================
  // user-local (14)
  // =========================================================================
  {
    path: 'C:\\Users\\maria\\AppData\\Local\\Programs\\Python\\Python313\\python.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\lucas\\AppData\\Local\\Programs\\Notepad++\\notepad++.exe',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '/home/nina/.local/bin/rg',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: '~/.local/share/blender/blender',
    installScope: 'user-local',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\maria\\AppData\\Local\\Programs\\Microsoft VS Code\\resources\\app.asar',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\lucas\\AppData\\Local\\Discord\\app-1.0.9170\\Discord.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\nina\\AppData\\Local\\Programs\\Obsidian\\Obsidian.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\omar\\AppData\\Local\\slack\\app-4.41.97\\slack.exe',
    installScope: 'user-local',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\maria\\AppData\\Roaming\\Notion\\GPUCache\\data_0',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\lucas\\workspace\\dashboard\\node_modules\\vite\\dist\\node\\index.js',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: '/home/nina/repos/engine/target/debug/incremental/engine/s-9988.bin',
    installScope: 'user-local',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\maria\\Downloads\\SlackSetup.exe',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\lucas\\AppData\\Local\\SquirrelTemp\\tempc\\Discord-1.0.9170-full.nupkg',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\omar\\Downloads\\Python-3.13.0-amd64-Setup.exe',
    installScope: 'user-local',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },

  // =========================================================================
  // pkg-manager (14)
  // =========================================================================
  {
    path: 'C:\\Users\\maria\\scoop\\apps\\fd\\current\\fd.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\ffmpeg\\tools\\ffmpeg.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\lucas\\.cargo\\bin\\hyperfine.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Program Files\\WindowsApps\\PythonSoftwareFoundation.Python.3.12_3.12.2032.0_x64__qbz5n2kfra8p0\\python.exe',
    installScope: 'pkg-manager',
    bloatKind: 'clean-native',
    action: 'keep-canonical',
  },
  {
    path: 'C:\\Users\\maria\\scoop\\apps\\discord\\current\\Discord.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\lib\\vscode\\tools\\Code.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Program Files\\WindowsApps\\NotionLabs.Notion_3.14.0.0_x64__abc123\\Notion.exe',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: '/var/lib/flatpak/app/md.obsidian.Obsidian/current/active/files/resources/app.asar',
    installScope: 'pkg-manager',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'C:\\Users\\maria\\AppData\\Local\\pnpm\\global\\5\\node_modules\\tsx\\dist\\cli.mjs',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\lucas\\.cargo\\registry\\cache\\index.crates.io-6f17d22bba15001f\\clap-4.5.18.crate',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\omar\\AppData\\Local\\pnpm\\store\\v3\\files\\99\\8877665544',
    installScope: 'pkg-manager',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\maria\\scoop\\cache\\python#3.12.6#python-3.12.6-amd64-Setup.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\ProgramData\\chocolatey\\choco-cache\\vscode\\VSCodeSetup-x64-1.94.exe',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'C:\\Users\\lucas\\scoop\\cache\\ffmpeg#7.0.2#ffmpeg-7.0.2-installer.msi',
    installScope: 'pkg-manager',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },

  // =========================================================================
  // portable-backup (14)
  // =========================================================================
  {
    path: 'D:\\Tools\\WinMergePortable\\WinMergeU.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'E:\\OldPC_Backup\\Program Files\\7-Zip\\7z.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'F:\\DiskCopy_2022\\Program Files\\Notepad++\\notepad++.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'G:\\Archive_Laptop\\Tools\\ripgrep\\rg.exe',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: '/Volumes/OldMacHD/Applications/Blender.app/Contents/MacOS/Blender',
    installScope: 'portable-backup',
    bloatKind: 'clean-native',
    action: 'review-human',
  },
  {
    path: 'D:\\Portable\\VSCodePortable\\Code.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'E:\\OldPC_Backup\\Users\\maria\\AppData\\Local\\Postman\\app-10.24.0\\Postman.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\lucas\\AppData\\Local\\Programs\\Notion\\Notion.exe',
    installScope: 'portable-backup',
    bloatKind: 'electron-chromium-dup',
    action: 'dedup-duplicate',
  },
  {
    path: 'E:\\OldPC_Backup\\Users\\maria\\code\\site\\node_modules\\esbuild\\lib\\main.js',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'F:\\DiskCopy_2022\\Users\\lucas\\AppData\\Roaming\\Code\\Code Cache\\js\\data_0',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'G:\\Archive_Laptop\\projects\\cli\\target\\debug\\deps\\libregex.rlib',
    installScope: 'portable-backup',
    bloatKind: 'cache-build-bloat',
    action: 'purge-bloat',
  },
  {
    path: 'E:\\OldPC_Backup\\Users\\maria\\Downloads\\FirefoxSetup-115.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'F:\\DiskCopy_2022\\Downloads\\NodeJS-18.17.1-x64.msi',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
  {
    path: 'D:\\Software_Backup\\Installers\\OBS-Studio-30.1-Installer.exe',
    installScope: 'portable-backup',
    bloatKind: 'installer-leftover',
    action: 'purge-bloat',
  },
];
