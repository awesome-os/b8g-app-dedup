import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { PATH_HEAD_LABELS } from './path-dataset.mts';
import { loadPathModel, trainPathModel } from './path-model.mts';
import type { SoftwarePathModel } from './path-model.mts';
import { formatReportText, scanDirectoryRoots } from './scanner.mts';

function printUsage(): void {
  const lines = [
    'app-dedup — 100% Read-Only Software Path Deduplication & Bloat Scanner',
    '',
    'Usage:',
    '  node cli.mts train [--out <model.b8p>]',
    '  node cli.mts classify "<path>" [--model <model.b8p>] [--json]',
    '  node cli.mts teach "<path>" --scope <label> --bloat <label> --action <label> [--steps <n>] [--model <model.b8p>]',
    '  node cli.mts scan [roots...] [--json] [--depth <n>] [--max-entries <n>] [--model <model.b8p>]',
    '',
    'Valid labels:',
    `  --scope  : ${PATH_HEAD_LABELS.installScope.join(' | ')}`,
    `  --bloat  : ${PATH_HEAD_LABELS.bloatKind.join(' | ')}`,
    `  --action : ${PATH_HEAD_LABELS.action.join(' | ')}`,
  ];
  console.log(lines.join('\n'));
}

function getDefaultScanRoots(): string[] {
  const candidates: string[] = [];
  if (process.platform === 'win32') {
    candidates.push('C:\\Program Files');
    candidates.push('C:\\Program Files (x86)');
    const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local');
    candidates.push(path.join(localAppData, 'Programs'));
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications');
    candidates.push(path.join(os.homedir(), 'Applications'));
  } else {
    candidates.push('/opt');
    candidates.push(path.join(os.homedir(), '.local', 'share'));
  }

  return candidates.filter((dir) => {
    try {
      return fs.existsSync(dir) && fs.lstatSync(dir).isDirectory();
    } catch {
      return false;
    }
  });
}

function loadOrAutoTrainModel(modelPath?: string): SoftwarePathModel {
  try {
    return loadPathModel(modelPath);
  } catch (err) {
    if (modelPath !== undefined) {
      throw err;
    }
    const trained = trainPathModel();
    return loadPathModel(trained.modelPath);
  }
}

function assertValidLabel(
  flagName: string,
  value: string | undefined,
  allowed: readonly string[],
): void {
  if (value === undefined) {
    return;
  }
  if (!allowed.includes(value)) {
    throw new Error(`Invalid ${flagName} "${value}". Allowed values: ${allowed.join(', ')}`);
  }
}

export function runCli(argv: readonly string[]): number {
  const [command, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  if (command === 'train') {
    let outPath: string | undefined;
    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--out' && rest[i + 1] !== undefined) {
        outPath = rest[i + 1];
        i += 1;
      }
    }
    const result = trainPathModel(outPath);
    const sizeKb = (result.sizeBytes / 1024).toFixed(2);
    console.log('=== app-dedup Path Model Trained ===');
    console.log(`Model path           : ${result.modelPath}`);
    console.log(`Artifact size (.b8p) : ${result.sizeBytes} B (${sizeKb} KB)`);
    console.log(`Overall val accuracy : ${(result.overallValAccuracy * 100).toFixed(2)}%`);
    if (result.valAccuracy && typeof result.valAccuracy === 'object') {
      for (const [head, acc] of Object.entries(result.valAccuracy)) {
        if (typeof acc === 'number') {
          console.log(`  - ${head.padEnd(14)} : ${(acc * 100).toFixed(2)}%`);
        }
      }
    }
    return 0;
  }

  if (command === 'classify') {
    let targetPath: string | undefined;
    let modelPath: string | undefined;
    let asJson = false;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--model' && rest[i + 1] !== undefined) {
        modelPath = rest[i + 1];
        i += 1;
      } else if (arg === '--json') {
        asJson = true;
      } else if (targetPath === undefined && arg !== undefined && !arg.startsWith('--')) {
        targetPath = arg;
      }
    }

    if (!targetPath) {
      console.error('Error: classify requires a "<path>" argument.');
      return 1;
    }

    const model = loadOrAutoTrainModel(modelPath);
    const res = model.classifyPath(targetPath);

    if (asJson) {
      console.log(JSON.stringify({ path: targetPath, ...res }, null, 2));
      return 0;
    }

    console.log(`Path           : ${targetPath}`);
    console.log(
      `installScope   : ${res.installScope.label} (${(res.installScope.confidence * 100).toFixed(1)}%)`,
    );
    console.log(
      `bloatKind      : ${res.bloatKind.label} (${(res.bloatKind.confidence * 100).toFixed(1)}%)`,
    );
    console.log(
      `action         : ${res.action.label} (${(res.action.confidence * 100).toFixed(1)}%)`,
    );
    console.log(`minConfidence  : ${(res.minConfidence * 100).toFixed(1)}%`);
    console.log(`needsProposal  : ${res.needsProposal}`);
    console.log(`latencyMs      : ${res.latencyMs.toFixed(3)} ms`);
    return 0;
  }

  if (command === 'teach') {
    let targetPath: string | undefined;
    let scope: string | undefined;
    let bloat: string | undefined;
    let action: string | undefined;
    let modelPath: string | undefined;
    let steps: number | undefined;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--scope' && rest[i + 1] !== undefined) {
        scope = rest[i + 1];
        i += 1;
      } else if (arg === '--bloat' && rest[i + 1] !== undefined) {
        bloat = rest[i + 1];
        i += 1;
      } else if (arg === '--action' && rest[i + 1] !== undefined) {
        action = rest[i + 1];
        i += 1;
      } else if (arg === '--model' && rest[i + 1] !== undefined) {
        modelPath = rest[i + 1];
        i += 1;
      } else if (arg === '--steps' && rest[i + 1] !== undefined) {
        const parsed = Number.parseInt(rest[i + 1] ?? '', 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          steps = parsed;
        }
        i += 1;
      } else if (targetPath === undefined && arg !== undefined && !arg.startsWith('--')) {
        targetPath = arg;
      }
    }

    if (!targetPath) {
      console.error('Error: teach requires a "<path>" argument.');
      return 1;
    }
    if (scope === undefined && bloat === undefined && action === undefined) {
      console.error('Error: teach requires at least one of --scope, --bloat, or --action.');
      return 1;
    }

    assertValidLabel('--scope', scope, PATH_HEAD_LABELS.installScope);
    assertValidLabel('--bloat', bloat, PATH_HEAD_LABELS.bloatKind);
    assertValidLabel('--action', action, PATH_HEAD_LABELS.action);

    const model = loadOrAutoTrainModel(modelPath);
    const before = model.classifyPath(targetPath);
    model.crystallizePath(
      targetPath,
      {
        installScope: scope,
        bloatKind: bloat,
        action,
      },
      steps,
    );
    model.save(modelPath);
    const after = model.classifyPath(targetPath);

    console.log(`Crystallized: ${targetPath}`);
    console.log(
      `Before      : ${before.installScope.label} / ${before.bloatKind.label} / ${before.action.label} (minConf=${(before.minConfidence * 100).toFixed(1)}%, needsProposal=${before.needsProposal})`,
    );
    console.log(
      `After       : ${after.installScope.label} / ${after.bloatKind.label} / ${after.action.label} (minConf=${(after.minConfidence * 100).toFixed(1)}%, needsProposal=${after.needsProposal})`,
    );
    return 0;
  }

  if (command === 'scan') {
    const roots: string[] = [];
    let asJson = false;
    let maxDepth = 2;
    let maxEntries = 2000;
    let modelPath: string | undefined;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--json') {
        asJson = true;
      } else if (arg === '--depth' && rest[i + 1] !== undefined) {
        const parsed = Number.parseInt(rest[i + 1] ?? '', 10);
        if (Number.isFinite(parsed) && parsed >= 1) {
          maxDepth = parsed;
        }
        i += 1;
      } else if (arg === '--max-entries' && rest[i + 1] !== undefined) {
        const parsed = Number.parseInt(rest[i + 1] ?? '', 10);
        if (Number.isFinite(parsed) && parsed >= 1) {
          maxEntries = parsed;
        }
        i += 1;
      } else if (arg === '--model' && rest[i + 1] !== undefined) {
        modelPath = rest[i + 1];
        i += 1;
      } else if (arg !== undefined && !arg.startsWith('--')) {
        roots.push(arg);
      }
    }

    const effectiveRoots = roots.length > 0 ? roots : getDefaultScanRoots();
    const model = loadOrAutoTrainModel(modelPath);
    const report = scanDirectoryRoots(effectiveRoots, model, { maxDepth, maxEntries });

    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatReportText(report));
    }
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  return 1;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isMainModule()) {
  try {
    const exitCode = runCli(process.argv.slice(2));
    process.exitCode = exitCode;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`app-dedup error: ${message}`);
    process.exitCode = 1;
  }
}
