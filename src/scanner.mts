import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import type { SoftwarePathModel } from './path-model.mts';

export interface HeadPrediction {
  readonly label: string;
  readonly confidence: number;
}

export interface PathClassification {
  readonly installScope: HeadPrediction;
  readonly bloatKind: HeadPrediction;
  readonly action: HeadPrediction;
  readonly minConfidence: number;
  readonly needsProposal: boolean;
  readonly latencyMs: number;
}

export interface ScannedEntry {
  readonly path: string;
  readonly root: string;
  readonly name: string;
  readonly appFamily: string;
  readonly bytes: number;
  readonly fileCount: number;
  readonly depth: number;
  readonly classification: PathClassification;
}

export interface DuplicateAppGroup {
  readonly appFamily: string;
  readonly count: number;
  readonly totalBytes: number;
  readonly reclaimableEstimateBytes: number;
  readonly scopes: readonly string[];
  readonly entries: readonly ScannedEntry[];
}

export interface ScanOptions {
  readonly maxDepth?: number;
  readonly maxEntries?: number;
}

export interface ScanReport {
  readonly roots: readonly string[];
  readonly scannedAt: string;
  readonly durationMs: number;
  readonly totalEntries: number;
  readonly totalScannedBytes: number;
  readonly electronDupBytes: number;
  readonly cacheBloatBytes: number;
  readonly installerLeftoverBytes: number;
  readonly duplicateAppGroups: readonly DuplicateAppGroup[];
  readonly proposals: readonly ScannedEntry[];
  readonly entries: readonly ScannedEntry[];
  readonly skippedPaths: number;
}

const APP_FAMILY_EXACT: Readonly<Record<string, string>> = {
  'visual studio code': 'vscode',
  'visual studio code insiders': 'vscode',
  'microsoft vs code': 'vscode',
  'microsoft vs code insiders': 'vscode',
  'vscode': 'vscode',
  'vs code': 'vscode',
  'vscode insiders': 'vscode',
  'code': 'vscode',
  'discord': 'discord',
  'discordptb': 'discord',
  'discord ptb': 'discord',
  'discordcanary': 'discord',
  'discord canary': 'discord',
  'discorddevelopment': 'discord',
  'google chrome': 'chrome',
  'chrome': 'chrome',
  'chrome sxs': 'chrome',
  'chromium': 'chrome',
  'microsoft edge': 'edge',
  'edge': 'edge',
  'edgecore': 'edge',
  'slack': 'slack',
  'notion': 'notion',
  'obsidian': 'obsidian',
  'spotify': 'spotify',
  'postman': 'postman',
  'nodejs': 'node',
  'node.js': 'node',
  'node': 'node',
  'git': 'git',
  'git for windows': 'git',
  'microsoft teams': 'teams',
  'teams': 'teams',
  'ms-teams': 'teams',
};

const CONTAINER_DIRS: ReadonlySet<string> = new Set([
  'program files',
  'program files (x86)',
  'appdata',
  'local',
  'locallow',
  'roaming',
  'programs',
  'oldpc_backup',
  'backup',
  'backups',
  'users',
  'opt',
  'usr',
  'share',
  'applications',
  'scoop',
  'apps',
  'chocolatey',
  'lib',
  'project',
  'projects',
  'workspace',
  'repos',
  'google',
  'microsoft',
  'jetbrains',
  'adobe',
  'common files',
]);

const IGNORED_FS_CODES: ReadonlySet<string> = new Set([
  'EACCES',
  'EPERM',
  'ENOENT',
  'EBUSY',
  'ENOTDIR',
  'ELOOP',
  'UNKNOWN',
]);

function extractBasename(dirPath: string): string {
  const trimmed = dirPath.replace(/[\\/]+$/, '');
  if (trimmed.length === 0) {
    return '';
  }
  const parts = trimmed.split(/[\\/]+/);
  return parts[parts.length - 1] ?? '';
}

/**
 * Normalizes a software installation directory path into a canonical app family key.
 */
export function normalizeAppFamily(dirPath: string): string {
  const base = extractBasename(dirPath).trim();
  if (base.length === 0) {
    return 'unknown';
  }

  const lower = base.toLowerCase();
  const compactSpaces = lower.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  const exactDirect = APP_FAMILY_EXACT[lower] ?? APP_FAMILY_EXACT[compactSpaces];
  if (exactDirect !== undefined) {
    return exactDirect;
  }

  if (/^python(\s*\d+(\.\d+)*)?$/i.test(compactSpaces)) {
    return 'python';
  }
  if (/^node(\.js|js)?(\s*v?\d+(\.\d+)*)?$/i.test(compactSpaces)) {
    return 'node';
  }
  if (/^discord\s*(ptb|canary|development)?$/i.test(compactSpaces)) {
    return 'discord';
  }
  if (/^(microsoft\s+)?(vs\s*code|visual\s+studio\s+code)(\s+insiders)?$/i.test(compactSpaces)) {
    return 'vscode';
  }
  if (/^(google\s+)?chrome(\s+beta|\s+dev|\s+canary|\s+sxs)?$/i.test(compactSpaces)) {
    return 'chrome';
  }
  if (/^(microsoft\s+)?edge(\s+beta|\s+dev|\s+canary)?$/i.test(compactSpaces)) {
    return 'edge';
  }

  const normalized = lower
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized : 'unknown';
}

function isIgnoredFsError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as { code?: unknown }).code ?? '');
    return IGNORED_FS_CODES.has(code);
  }
  return false;
}

interface DirSizeResult {
  readonly bytes: number;
  readonly fileCount: number;
  readonly skipped: number;
}

function measureDirectoryReadOnly(dirPath: string): DirSizeResult {
  let bytes = 0;
  let fileCount = 0;
  let skipped = 0;
  const stack: string[] = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      break;
    }

    let dirents: fs.Dirent[];
    try {
      dirents = fs.readdirSync(current, { withFileTypes: true });
    } catch (err) {
      if (isIgnoredFsError(err)) {
        skipped += 1;
        continue;
      }
      skipped += 1;
      continue;
    }

    for (const dirent of dirents) {
      if (dirent.isSymbolicLink()) {
        continue;
      }
      const fullPath = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(fullPath);
      } else if (dirent.isFile()) {
        try {
          const st = fs.lstatSync(fullPath);
          bytes += st.size;
          fileCount += 1;
        } catch (err) {
          if (isIgnoredFsError(err)) {
            skipped += 1;
          } else {
            skipped += 1;
          }
        }
      }
    }
  }

  return { bytes, fileCount, skipped };
}

function canonicalKey(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/**
 * 100% READ-ONLY directory root scanner.
 * Never deletes, renames, or modifies any user files.
 */
export function scanDirectoryRoots(
  roots: readonly string[],
  model: SoftwarePathModel,
  opts?: ScanOptions,
): ScanReport {
  const start = performance.now();
  const maxDepth = Math.max(1, opts?.maxDepth ?? 2);
  const maxEntries = Math.max(1, opts?.maxEntries ?? 2000);

  const normalizedRoots: string[] = [];
  const entries: ScannedEntry[] = [];
  const seenCandidates = new Set<string>();
  let skippedPaths = 0;

  interface WalkFrame {
    readonly dirPath: string;
    readonly root: string;
    readonly depth: number;
  }

  for (const rawRoot of roots) {
    const resolvedRoot = path.resolve(rawRoot);
    try {
      const st = fs.lstatSync(resolvedRoot);
      if (!st.isDirectory()) {
        skippedPaths += 1;
        continue;
      }
    } catch (err) {
      if (isIgnoredFsError(err)) {
        skippedPaths += 1;
        continue;
      }
      skippedPaths += 1;
      continue;
    }

    normalizedRoots.push(resolvedRoot);
    const queue: WalkFrame[] = [{ dirPath: resolvedRoot, root: resolvedRoot, depth: 0 }];

    while (queue.length > 0 && entries.length < maxEntries) {
      const frame = queue.shift();
      if (frame === undefined) {
        break;
      }

      let dirents: fs.Dirent[];
      try {
        dirents = fs.readdirSync(frame.dirPath, { withFileTypes: true });
      } catch (err) {
        if (isIgnoredFsError(err)) {
          skippedPaths += 1;
          continue;
        }
        skippedPaths += 1;
        continue;
      }

      const childDirs: fs.Dirent[] = [];
      for (const d of dirents) {
        if (!d.isSymbolicLink() && d.isDirectory()) {
          childDirs.push(d);
        }
      }

      if (frame.depth === 0) {
        for (const child of childDirs) {
          queue.push({
            dirPath: path.join(frame.dirPath, child.name),
            root: frame.root,
            depth: 1,
          });
        }
        continue;
      }

      const dirName = extractBasename(frame.dirPath);
      const isContainer = CONTAINER_DIRS.has(dirName.toLowerCase());

      if (isContainer && frame.depth < maxDepth && childDirs.length > 0) {
        for (const child of childDirs) {
          queue.push({
            dirPath: path.join(frame.dirPath, child.name),
            root: frame.root,
            depth: frame.depth + 1,
          });
        }
        continue;
      }

      const key = canonicalKey(frame.dirPath);
      if (seenCandidates.has(key)) {
        continue;
      }
      seenCandidates.add(key);

      const measured = measureDirectoryReadOnly(frame.dirPath);
      skippedPaths += measured.skipped;
      const classification = model.classifyPath(frame.dirPath);

      entries.push({
        path: frame.dirPath,
        root: frame.root,
        name: dirName,
        appFamily: normalizeAppFamily(frame.dirPath),
        bytes: measured.bytes,
        fileCount: measured.fileCount,
        depth: frame.depth,
        classification,
      });
    }
  }

  let totalScannedBytes = 0;
  let electronDupBytes = 0;
  let cacheBloatBytes = 0;
  let installerLeftoverBytes = 0;

  const byFamily = new Map<string, ScannedEntry[]>();

  for (const entry of entries) {
    totalScannedBytes += entry.bytes;
    const bloat = entry.classification.bloatKind.label;
    if (bloat === 'electron-chromium-dup') {
      electronDupBytes += entry.bytes;
    } else if (bloat === 'cache-build-bloat') {
      cacheBloatBytes += entry.bytes;
    } else if (bloat === 'installer-leftover') {
      installerLeftoverBytes += entry.bytes;
    }

    if (bloat !== 'cache-build-bloat' && entry.appFamily !== 'unknown') {
      const list = byFamily.get(entry.appFamily);
      if (list !== undefined) {
        list.push(entry);
      } else {
        byFamily.set(entry.appFamily, [entry]);
      }
    }
  }

  const duplicateAppGroups: DuplicateAppGroup[] = [];
  for (const [appFamily, groupEntries] of byFamily.entries()) {
    if (groupEntries.length < 2) {
      continue;
    }
    const distinctRoots = new Set(groupEntries.map((e) => canonicalKey(e.root)));
    const distinctParents = new Set(groupEntries.map((e) => canonicalKey(path.dirname(e.path))));
    const distinctScopes = new Set(groupEntries.map((e) => e.classification.installScope.label));

    if (distinctRoots.size >= 2 || distinctScopes.size >= 2 || distinctParents.size >= 2) {
      const sortedEntries = [...groupEntries].sort((a, b) => b.bytes - a.bytes);
      let totalBytes = 0;
      let largest = 0;
      for (const e of sortedEntries) {
        totalBytes += e.bytes;
        if (e.bytes > largest) {
          largest = e.bytes;
        }
      }
      duplicateAppGroups.push({
        appFamily,
        count: sortedEntries.length,
        totalBytes,
        reclaimableEstimateBytes: Math.max(0, totalBytes - largest),
        scopes: [...distinctScopes].sort(),
        entries: sortedEntries,
      });
    }
  }

  duplicateAppGroups.sort((a, b) => b.totalBytes - a.totalBytes || a.appFamily.localeCompare(b.appFamily));

  const proposals = entries
    .filter((e) => e.classification.needsProposal)
    .sort(
      (a, b) =>
        b.bytes - a.bytes ||
        a.classification.minConfidence - b.classification.minConfidence ||
        a.path.localeCompare(b.path),
    );

  const durationMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    roots: normalizedRoots,
    scannedAt: new Date().toISOString(),
    durationMs,
    totalEntries: entries.length,
    totalScannedBytes,
    electronDupBytes,
    cacheBloatBytes,
    installerLeftoverBytes,
    duplicateAppGroups,
    proposals,
    entries,
    skippedPaths,
  };
}

function formatGigabytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 0.01) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.01) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  if (kb >= 0.1) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : ' '.repeat(width - text.length) + text;
}

/**
 * Formats a ScanReport as a clean, human-readable terminal summary table.
 */
export function formatReportText(report: ScanReport): string {
  const lines: string[] = [];
  const totalGb = (report.totalScannedBytes / (1024 * 1024 * 1024)).toFixed(3);
  const electronGb = (report.electronDupBytes / (1024 * 1024 * 1024)).toFixed(3);
  const cacheGb = (report.cacheBloatBytes / (1024 * 1024 * 1024)).toFixed(3);

  lines.push('=== app-dedup Read-Only Scan Report ===');
  lines.push(`Scanned at          : ${report.scannedAt} (${report.durationMs.toFixed(1)} ms)`);
  lines.push(`Roots               : ${report.roots.length > 0 ? report.roots.join(', ') : '(none)'}`);
  lines.push(`Candidates scanned  : ${report.totalEntries} (skipped: ${report.skippedPaths})`);
  lines.push(`Total scanned       : ${totalGb} GB (${formatGigabytes(report.totalScannedBytes)})`);
  lines.push(`Electron/Chromium   : ${electronGb} GB (${formatGigabytes(report.electronDupBytes)})`);
  lines.push(`Cache/Build bloat   : ${cacheGb} GB (${formatGigabytes(report.cacheBloatBytes)})`);
  lines.push(`Installer leftovers : ${formatGigabytes(report.installerLeftoverBytes)}`);

  lines.push('');
  lines.push(`--- Duplicate App Groups (${report.duplicateAppGroups.length}) ---`);
  if (report.duplicateAppGroups.length === 0) {
    lines.push('  (none detected)');
  } else {
    lines.push(
      `  ${padRight('App Family', 16)} ${padLeft('Copies', 6)} ${padLeft('Total', 12)} ${padLeft('Reclaimable', 12)}  Scopes`,
    );
    lines.push(`  ${'-'.repeat(72)}`);
    for (const group of report.duplicateAppGroups) {
      lines.push(
        `  ${padRight(group.appFamily, 16)} ${padLeft(String(group.count), 6)} ${padLeft(formatGigabytes(group.totalBytes), 12)} ${padLeft(formatGigabytes(group.reclaimableEstimateBytes), 12)}  ${group.scopes.join(', ')}`,
      );
      for (const entry of group.entries) {
        lines.push(
          `    - [${entry.classification.installScope.label}] (${formatGigabytes(entry.bytes)}) ${entry.path}`,
        );
      }
    }
  }

  lines.push('');
  lines.push(`--- Top Active-Learning Proposals (${report.proposals.length}) ---`);
  if (report.proposals.length === 0) {
    lines.push('  (none — all scanned paths classified with high confidence)');
  } else {
    const top = report.proposals.slice(0, 15);
    lines.push(
      `  ${padLeft('Size', 12)} ${padLeft('MinConf', 8)}  ${padRight('Guess (scope / bloat / action)', 46)} Path`,
    );
    lines.push(`  ${'-'.repeat(96)}`);
    for (const p of top) {
      const guess = `${p.classification.installScope.label} / ${p.classification.bloatKind.label} / ${p.classification.action.label}`;
      lines.push(
        `  ${padLeft(formatGigabytes(p.bytes), 12)} ${padLeft(`${(p.classification.minConfidence * 100).toFixed(1)}%`, 8)}  ${padRight(guess, 46)} ${p.path}`,
      );
    }
    lines.push('');
    lines.push('  Tip: Teach an unknown path with:');
    lines.push('    node cli.mts teach "<path>" --scope <scope> --bloat <bloat> --action <action>');
  }

  return lines.join('\n');
}
