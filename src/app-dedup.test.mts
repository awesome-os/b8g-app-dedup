import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  PATH_HEAD_LABELS,
  PATH_TRAIN_SAMPLES,
  PATH_VAL_SAMPLES,
} from './path-dataset.mts';
import { loadPathModel, trainPathModel } from './path-model.mts';
import {
  formatReportText,
  normalizeAppFamily,
  scanDirectoryRoots,
} from './scanner.mts';

function writeDummyFile(filePath: string, sizeBytes: number): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.alloc(sizeBytes, 0x61));
}

describe('app-dedup dataset, model, and read-only scanner', () => {
  it('keeps PATH_TRAIN_SAMPLES and PATH_VAL_SAMPLES strictly disjoint', () => {
    assert.ok(PATH_TRAIN_SAMPLES.length >= 160, `Expected >= 160 train samples, got ${PATH_TRAIN_SAMPLES.length}`);
    assert.ok(PATH_VAL_SAMPLES.length >= 48, `Expected >= 48 val samples, got ${PATH_VAL_SAMPLES.length}`);

    const trainPaths = new Set<string>(
      PATH_TRAIN_SAMPLES.map((s) => s.path.trim().toLowerCase()),
    );
    const overlaps: string[] = [];
    for (const valSample of PATH_VAL_SAMPLES) {
      const key = valSample.path.trim().toLowerCase();
      if (trainPaths.has(key)) {
        overlaps.push(valSample.path);
      }
    }
    assert.deepEqual(overlaps, [], `Train/val overlap detected: ${overlaps.join(', ')}`);

    // Verify every class of all 3 heads is represented in PATH_VAL_SAMPLES
    for (const label of PATH_HEAD_LABELS.installScope) {
      assert.ok(
        PATH_VAL_SAMPLES.some((s) => s.installScope === label),
        `Missing installScope "${label}" in PATH_VAL_SAMPLES`,
      );
    }
    for (const label of PATH_HEAD_LABELS.bloatKind) {
      assert.ok(
        PATH_VAL_SAMPLES.some((s) => s.bloatKind === label),
        `Missing bloatKind "${label}" in PATH_VAL_SAMPLES`,
      );
    }
    for (const label of PATH_HEAD_LABELS.action) {
      assert.ok(
        PATH_VAL_SAMPLES.some((s) => s.action === label),
        `Missing action "${label}" in PATH_VAL_SAMPLES`,
      );
    }
  });

  it('normalizes common app families consistently', () => {
    assert.equal(normalizeAppFamily('C:\\Program Files\\Microsoft VS Code'), 'vscode');
    assert.equal(normalizeAppFamily('C:\\Users\\alice\\AppData\\Local\\Programs\\VSCode'), 'vscode');
    assert.equal(normalizeAppFamily('/opt/Visual Studio Code'), 'vscode');
    assert.equal(normalizeAppFamily('D:\\Apps\\Code'), 'vscode');
    assert.equal(normalizeAppFamily('C:\\Users\\alice\\AppData\\Local\\Discord'), 'discord');
    assert.equal(normalizeAppFamily('C:\\Users\\alice\\AppData\\Local\\DiscordPTB'), 'discord');
    assert.equal(normalizeAppFamily('E:\\OldPC_Backup\\DiscordCanary'), 'discord');
    assert.equal(normalizeAppFamily('C:\\Program Files\\Google\\Chrome'), 'chrome');
    assert.equal(normalizeAppFamily('C:\\Program Files (x86)\\Microsoft\\Microsoft Edge'), 'edge');
    assert.equal(normalizeAppFamily('C:\\Program Files\\Nodejs'), 'node');
    assert.equal(normalizeAppFamily('C:\\Program Files\\Node.js'), 'node');
    assert.equal(normalizeAppFamily('C:\\Python311'), 'python');
    assert.equal(normalizeAppFamily('C:\\Python312'), 'python');
    assert.equal(normalizeAppFamily('C:\\Program Files\\Git'), 'git');
    assert.equal(normalizeAppFamily('D:\\Custom\\MyTool App'), 'mytool-app');
  });

  it('trains .b8p model >= 0.88 val accuracy, < 128 KB, detects duplicates/bloat, and crystallizes unknowns', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-dedup-test-'));
    try {
      const modelOut = path.join(tmpDir, 'test-app-paths.b8p');
      const trainResult = trainPathModel(modelOut);

      assert.ok(
        trainResult.overallValAccuracy >= 0.88,
        `Expected overallValAccuracy >= 0.88, got ${trainResult.overallValAccuracy}`,
      );
      assert.ok(
        trainResult.sizeBytes > 0 && trainResult.sizeBytes < 128 * 1024,
        `Expected .b8p size < 128 KB, got ${trainResult.sizeBytes} bytes`,
      );
      assert.ok(fs.existsSync(trainResult.modelPath), 'Expected trained .b8p model file to exist');

      // Build synthetic directory tree
      const treeRoot = path.join(tmpDir, 'synthetic-disk');
      const vscodeAdmin = path.join(treeRoot, 'Program Files', 'Microsoft VS Code');
      const vscodeUser = path.join(treeRoot, 'AppData', 'Local', 'Programs', 'VSCode');
      const discordBackup = path.join(treeRoot, 'OldPC_Backup', 'Discord');
      const discordUser = path.join(treeRoot, 'AppData', 'Local', 'Discord');
      const nodeModules = path.join(treeRoot, 'project', 'node_modules');
      const mysteryDir = path.join(treeRoot, 'ZzzQqxMystery999');

      writeDummyFile(path.join(vscodeAdmin, 'Code.exe'), 4096);
      writeDummyFile(path.join(vscodeUser, 'Code.exe'), 4096);
      writeDummyFile(path.join(discordBackup, 'Discord.exe'), 3072);
      writeDummyFile(path.join(discordUser, 'Discord.exe'), 3072);
      writeDummyFile(path.join(nodeModules, 'pkg', 'index.js'), 8192);
      writeDummyFile(path.join(mysteryDir, 'blob.bin'), 16384);

      const model = loadPathModel(modelOut);
      const report = scanDirectoryRoots([treeRoot], model, { maxDepth: 4 });

      // Duplicate app groups: vscode and discord
      const vscodeGroup = report.duplicateAppGroups.find((g) => g.appFamily === 'vscode');
      const discordGroup = report.duplicateAppGroups.find((g) => g.appFamily === 'discord');
      assert.ok(vscodeGroup !== undefined, 'Expected duplicateAppGroups to include "vscode"');
      assert.equal(vscodeGroup.count, 2, 'Expected 2 vscode copies');
      assert.ok(discordGroup !== undefined, 'Expected duplicateAppGroups to include "discord"');
      assert.equal(discordGroup.count, 2, 'Expected 2 discord copies');

      // Bloat detection
      assert.ok(
        report.electronDupBytes > 0,
        `Expected electronDupBytes > 0, got ${report.electronDupBytes}`,
      );
      assert.ok(
        report.cacheBloatBytes > 0,
        `Expected cacheBloatBytes > 0, got ${report.cacheBloatBytes}`,
      );

      // Active-Learning proposal queue should surface ZzzQqxMystery999
      const mysteryProposal = report.proposals.find((p) => p.name === 'ZzzQqxMystery999');
      assert.ok(
        mysteryProposal !== undefined,
        'Expected ZzzQqxMystery999 to appear in Active-Learning proposals',
      );

      // Proposals sorted descending by bytes
      for (let i = 1; i < report.proposals.length; i += 1) {
        const prev = report.proposals[i - 1];
        const curr = report.proposals[i];
        assert.ok(
          prev !== undefined && curr !== undefined && prev.bytes >= curr.bytes,
          'Expected proposals to be sorted descending by bytes',
        );
      }

      // Report text formatting
      const text = formatReportText(report);
      assert.ok(text.includes('vscode'), 'Expected formatted report to mention vscode');
      assert.ok(text.includes('discord'), 'Expected formatted report to mention discord');
      assert.ok(text.includes('ZzzQqxMystery999'), 'Expected formatted report to mention ZzzQqxMystery999');

      // Teach / crystallize the unknown folder and verify it disappears from proposals on re-scan
      model.crystallizePath(mysteryDir, {
        installScope: 'portable-backup',
        bloatKind: 'clean-native',
        action: 'keep-canonical',
      });
      model.save(modelOut);

      const reloaded = loadPathModel(modelOut);
      const rescan = scanDirectoryRoots([treeRoot], reloaded, { maxDepth: 4 });
      const stillProposed = rescan.proposals.find((p) => p.name === 'ZzzQqxMystery999');
      assert.equal(
        stillProposed,
        undefined,
        'Expected ZzzQqxMystery999 to be removed from proposals after crystallizePath()',
      );

      // Verify 100% read-only guarantee: all synthetic files still exist untouched
      assert.ok(fs.existsSync(path.join(vscodeAdmin, 'Code.exe')));
      assert.ok(fs.existsSync(path.join(vscodeUser, 'Code.exe')));
      assert.ok(fs.existsSync(path.join(discordBackup, 'Discord.exe')));
      assert.ok(fs.existsSync(path.join(discordUser, 'Discord.exe')));
      assert.ok(fs.existsSync(path.join(nodeModules, 'pkg', 'index.js')));
      assert.ok(fs.existsSync(path.join(mysteryDir, 'blob.bin')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
