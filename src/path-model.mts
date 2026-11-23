/**
 * Shared-encoder multi-task MLP + Bloom unknown-segment detector for software
 * installation path classification.
 *
 * Architecture:
 *   Input:  V = 1024 FNV-1a hashed word + path-segment + bigram + ext + char 3-gram features (L2-normalized)
 *   Hidden: H = 40 ReLU shared encoder
 *   Heads:  3 softmax heads (installScope[4], bloatKind[4], action[4])
 *   Format: INT8 quantized `.b8p` binary (magic = "B8GP", ~42 KB, < 128 KB)
 *
 * Erasable TypeScript (erasableSyntaxOnly: true), zero external dependencies,
 * Node 22+ built-ins only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  PATH_HEAD_LABELS,
  PATH_TRAIN_SAMPLES,
  PATH_VAL_SAMPLES,
  type ActionLabel,
  type BloatKindLabel,
  type InstallScopeLabel,
  type PathHeadName,
  type PathSample,
} from './path-dataset.mts';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MODEL_PATH: string = path.join(
  MODULE_DIR,
  'dist',
  'app-paths.b8p',
);

const MAGIC_STR = 'B8GP';
const FORMAT_VERSION = 1;
const VOCAB_SIZE = 1024;
const HIDDEN_SIZE = 40;
const BLOOM_BYTES = 512; // 4096 bits
const BLOOM_BITS = BLOOM_BYTES * 8;
const BLOOM_HASHES = 3;
const CONFIDENCE_THRESHOLD = 0.72;
const BLOOM_MIN_KNOWN_RATIO = 0.35;

const HEAD_NAMES: readonly PathHeadName[] = [
  'installScope',
  'bloatKind',
  'action',
] as const;

const HEAD_SIZES: readonly [number, number, number] = [
  PATH_HEAD_LABELS.installScope.length,
  PATH_HEAD_LABELS.bloatKind.length,
  PATH_HEAD_LABELS.action.length,
] as const;

export interface HeadPrediction<T extends string = string> {
  readonly label: T;
  readonly confidence: number;
}

export interface PathClassification {
  readonly installScope: HeadPrediction<InstallScopeLabel>;
  readonly bloatKind: HeadPrediction<BloatKindLabel>;
  readonly action: HeadPrediction<ActionLabel>;
  readonly minConfidence: number;
  readonly needsProposal: boolean;
  readonly latencyMs: number;
}

export interface CrystallizeLabels {
  readonly installScope?: string;
  readonly bloatKind?: string;
  readonly action?: string;
}

export interface TrainPathModelResult {
  readonly modelPath: string;
  readonly sizeBytes: number;
  readonly valAccuracy: Record<PathHeadName, number>;
  readonly overallValAccuracy: number;
}

/**
 * 32-bit FNV-1a hash with optional seed salt.
 */
function fnv1a32(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Deterministic PRNG (Mulberry32).
 */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizePath(pathStr: string): string {
  return pathStr.trim().replace(/\\/g, '/').replace(/\/+/g, '/').toLowerCase();
}

function extractSegments(normPath: string): string[] {
  const raw = normPath.split('/');
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const seg = raw[i];
    if (seg.length > 0) {
      out.push(seg);
    }
  }
  return out;
}

/**
 * Extract sparse-then-L2-normalized hashed features into a Float32Array(V=1024).
 */
function extractFeatures(pathStr: string): Float32Array {
  const vec = new Float32Array(VOCAB_SIZE);
  const norm = normalizePath(pathStr);
  const segments = extractSegments(norm);

  const addFeature = (key: string, weight: number): void => {
    const idx = fnv1a32(key) & (VOCAB_SIZE - 1);
    vec[idx] += weight;
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    addFeature(`seg:${seg}`, 1.6);

    // Explicit drive letter or leading root anchor
    if (i === 0 && seg.length === 2 && seg[1] === ':') {
      addFeature(`drv:${seg}`, 1.8);
    }

    // Segment bigrams capture structural context (e.g. appdata/local, scoop/apps, target/debug)
    if (i > 0) {
      addFeature(`bi:${segments[i - 1]}/${seg}`, 1.6);
    }

    // Word tokens within segment
    const words = seg.split(/[^a-z0-9]+/);
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      if (word.length >= 2) {
        addFeature(`w:${word}`, 1.25);

        // Character 3-grams over words
        if (word.length >= 3) {
          const padded = `^${word}$`;
          for (let c = 0; c <= padded.length - 3; c++) {
            addFeature(`g3:${padded.slice(c, c + 3)}`, 0.4);
          }
        }
      }
    }
  }

  // File extension feature on leaf segment
  if (segments.length > 0) {
    const leaf = segments[segments.length - 1];
    const dotIdx = leaf.lastIndexOf('.');
    if (dotIdx > 0 && dotIdx < leaf.length - 1) {
      const ext = leaf.slice(dotIdx + 1);
      if (ext.length <= 8) {
        addFeature(`ext:${ext}`, 1.5);
      }
    }
  }

  // Sublinear damping + L2 normalization
  let normSq = 0;
  for (let i = 0; i < VOCAB_SIZE; i++) {
    const v = vec[i];
    if (v > 0) {
      const damped = Math.log1p(v);
      vec[i] = damped;
      normSq += damped * damped;
    }
  }

  if (normSq > 0) {
    const invNorm = 1 / Math.sqrt(normSq);
    for (let i = 0; i < VOCAB_SIZE; i++) {
      vec[i] *= invNorm;
    }
  }

  return vec;
}

/**
 * Bloom filter helpers for tracking known path segments.
 */
const BLOOM_SEEDS: readonly [number, number, number] = [
  0x811c9dc5,
  0x9e3779b9,
  0x85ebca6b,
] as const;

function bloomAddToken(bloom: Uint8Array, token: string): void {
  for (let k = 0; k < BLOOM_HASHES; k++) {
    const bit = fnv1a32(token, BLOOM_SEEDS[k]) & (BLOOM_BITS - 1);
    bloom[bit >>> 3] |= 1 << (bit & 7);
  }
}

function bloomHasToken(bloom: Uint8Array, token: string): boolean {
  for (let k = 0; k < BLOOM_HASHES; k++) {
    const bit = fnv1a32(token, BLOOM_SEEDS[k]) & (BLOOM_BITS - 1);
    if ((bloom[bit >>> 3] & (1 << (bit & 7))) === 0) {
      return false;
    }
  }
  return true;
}

function bloomTokensForPath(pathStr: string): string[] {
  const norm = normalizePath(pathStr);
  const segments = extractSegments(norm);
  const tokens: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Skip pure numeric or single-char non-drive tokens
    if (seg.length === 1 && seg !== '~') continue;
    if (/^\d+$/.test(seg)) continue;
    tokens.push(seg);
  }
  return tokens;
}

function addPathToBloom(bloom: Uint8Array, pathStr: string): void {
  const tokens = bloomTokensForPath(pathStr);
  for (let i = 0; i < tokens.length; i++) {
    bloomAddToken(bloom, tokens[i]);
  }
}

function isBloomUnknownPath(bloom: Uint8Array, pathStr: string): boolean {
  const tokens = bloomTokensForPath(pathStr);
  if (tokens.length === 0) return true;
  let known = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (bloomHasToken(bloom, tokens[i])) {
      known++;
    }
  }
  return known / tokens.length < BLOOM_MIN_KNOWN_RATIO;
}

function softmax(logits: Float32Array): Float32Array {
  let maxVal = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > maxVal) maxVal = logits[i];
  }
  const probs = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] - maxVal);
    probs[i] = e;
    sum += e;
  }
  const invSum = sum > 0 ? 1 / sum : 1 / logits.length;
  for (let i = 0; i < probs.length; i++) {
    probs[i] *= invSum;
  }
  return probs;
}

function quantizeInt8(weights: Float32Array): {
  quantized: Int8Array;
  scale: number;
} {
  let maxAbs = 0;
  for (let i = 0; i < weights.length; i++) {
    const a = Math.abs(weights[i]);
    if (a > maxAbs) maxAbs = a;
  }
  const scale = maxAbs > 1e-8 ? maxAbs / 127 : 1 / 127;
  const invScale = 1 / scale;
  const quantized = new Int8Array(weights.length);
  for (let i = 0; i < weights.length; i++) {
    const q = Math.round(weights[i] * invScale);
    quantized[i] = q > 127 ? 127 : q < -127 ? -127 : q;
  }
  return { quantized, scale };
}

function dequantizeInt8(quantized: Int8Array, scale: number): Float32Array {
  const out = new Float32Array(quantized.length);
  for (let i = 0; i < quantized.length; i++) {
    out[i] = quantized[i] * scale;
  }
  return out;
}

function labelIndex(head: PathHeadName, label: string): number {
  const labels = PATH_HEAD_LABELS[head] as readonly string[];
  return labels.indexOf(label);
}

/**
 * Shared-encoder multi-task MLP + Bloom filter model for software paths.
 */
export class SoftwarePathModel {
  private w1: Float32Array;
  private b1: Float32Array;
  private w2: [Float32Array, Float32Array, Float32Array];
  private b2: [Float32Array, Float32Array, Float32Array];
  private bloom: Uint8Array;
  private defaultPath: string;

  constructor(
    w1: Float32Array,
    b1: Float32Array,
    w2: [Float32Array, Float32Array, Float32Array],
    b2: [Float32Array, Float32Array, Float32Array],
    bloom: Uint8Array,
    defaultPath: string = DEFAULT_MODEL_PATH,
  ) {
    this.w1 = w1;
    this.b1 = b1;
    this.w2 = w2;
    this.b2 = b2;
    this.bloom = bloom;
    this.defaultPath = defaultPath;
  }

  /**
   * Forward pass returning hidden activations and per-head softmax probabilities.
   */
  private forward(x: Float32Array): {
    hidden: Float32Array;
    probs: [Float32Array, Float32Array, Float32Array];
  } {
    const hidden = new Float32Array(HIDDEN_SIZE);
    const w1 = this.w1;
    const b1 = this.b1;

    for (let h = 0; h < HIDDEN_SIZE; h++) {
      const rowOffset = h * VOCAB_SIZE;
      let sum = b1[h];
      for (let i = 0; i < VOCAB_SIZE; i++) {
        const xi = x[i];
        if (xi !== 0) {
          sum += w1[rowOffset + i] * xi;
        }
      }
      hidden[h] = sum > 0 ? sum : 0;
    }

    const probs: [Float32Array, Float32Array, Float32Array] = [
      new Float32Array(HEAD_SIZES[0]),
      new Float32Array(HEAD_SIZES[1]),
      new Float32Array(HEAD_SIZES[2]),
    ];

    for (let headIdx = 0; headIdx < 3; headIdx++) {
      const numClasses = HEAD_SIZES[headIdx];
      const wh = this.w2[headIdx];
      const bh = this.b2[headIdx];
      const logits = new Float32Array(numClasses);

      for (let c = 0; c < numClasses; c++) {
        const rowOffset = c * HIDDEN_SIZE;
        let sum = bh[c];
        for (let h = 0; h < HIDDEN_SIZE; h++) {
          sum += wh[rowOffset + h] * hidden[h];
        }
        logits[c] = sum;
      }
      probs[headIdx] = softmax(logits);
    }

    return { hidden, probs };
  }

  /**
   * Single SGD step on one example with optional per-head target indices (-1 to skip a head).
   */
  public sgdStep(
    x: Float32Array,
    targets: readonly [number, number, number],
    lr: number,
    l2Decay: number,
    encoderLrScale = 1.0,
  ): void {
    const { hidden, probs } = this.forward(x);
    const dHidden = new Float32Array(HIDDEN_SIZE);

    for (let headIdx = 0; headIdx < 3; headIdx++) {
      const target = targets[headIdx];
      if (target < 0) continue;

      const numClasses = HEAD_SIZES[headIdx];
      const wh = this.w2[headIdx];
      const bh = this.b2[headIdx];
      const ph = probs[headIdx];

      for (let c = 0; c < numClasses; c++) {
        const grad = ph[c] - (c === target ? 1 : 0);
        const rowOffset = c * HIDDEN_SIZE;

        for (let h = 0; h < HIDDEN_SIZE; h++) {
          const wVal = wh[rowOffset + h];
          dHidden[h] += grad * wVal;
          wh[rowOffset + h] = wVal - lr * (grad * hidden[h] + l2Decay * wVal);
        }
        bh[c] -= lr * grad;
      }
    }

    const w1 = this.w1;
    const b1 = this.b1;
    const lrEnc = lr * encoderLrScale;

    for (let h = 0; h < HIDDEN_SIZE; h++) {
      if (hidden[h] <= 0) continue;
      const dh = dHidden[h];
      if (dh === 0) continue;

      const rowOffset = h * VOCAB_SIZE;
      for (let i = 0; i < VOCAB_SIZE; i++) {
        const xi = x[i];
        if (xi !== 0) {
          const wVal = w1[rowOffset + i];
          w1[rowOffset + i] = wVal - lrEnc * (dh * xi + l2Decay * wVal);
        } else if (l2Decay > 0) {
          w1[rowOffset + i] *= 1 - lrEnc * l2Decay;
        }
      }
      b1[h] -= lrEnc * dh;
    }
  }

  /**
   * Classify a software installation path across all 3 heads.
   */
  public classifyPath(pathStr: string): PathClassification {
    const t0 = performance.now();
    const x = extractFeatures(pathStr);
    const { probs } = this.forward(x);

    const pick = <T extends string>(
      labels: readonly T[],
      p: Float32Array,
    ): HeadPrediction<T> => {
      let bestIdx = 0;
      let bestProb = p[0];
      for (let i = 1; i < p.length; i++) {
        if (p[i] > bestProb) {
          bestProb = p[i];
          bestIdx = i;
        }
      }
      return {
        label: labels[bestIdx],
        confidence: bestProb,
      };
    };

    const installScope = pick(PATH_HEAD_LABELS.installScope, probs[0]);
    const bloatKind = pick(PATH_HEAD_LABELS.bloatKind, probs[1]);
    const action = pick(PATH_HEAD_LABELS.action, probs[2]);

    const minConfidence = Math.min(
      installScope.confidence,
      bloatKind.confidence,
      action.confidence,
    );
    const bloomUnknown = isBloomUnknownPath(this.bloom, pathStr);
    const needsProposal =
      minConfidence < CONFIDENCE_THRESHOLD || bloomUnknown;
    const latencyMs = performance.now() - t0;

    return {
      installScope,
      bloatKind,
      action,
      minConfidence,
      needsProposal,
      latencyMs,
    };
  }

  /**
   * Online crystallization: runs `steps` (default 12) SGD steps on the taught
   * path and registers its segments in the Bloom filter so it immediately
   * classifies with high confidence and `needsProposal: false`.
   */
  public crystallizePath(
    pathStr: string,
    labels: CrystallizeLabels,
    steps = 12,
  ): void {
    const x = extractFeatures(pathStr);
    const current = this.classifyPath(pathStr);

    const tScope =
      labels.installScope !== undefined
        ? labelIndex('installScope', labels.installScope)
        : labelIndex('installScope', current.installScope.label);
    const tBloat =
      labels.bloatKind !== undefined
        ? labelIndex('bloatKind', labels.bloatKind)
        : labelIndex('bloatKind', current.bloatKind.label);
    const tAction =
      labels.action !== undefined
        ? labelIndex('action', labels.action)
        : labelIndex('action', current.action.label);

    if (labels.installScope !== undefined && tScope < 0) {
      throw new Error(`Unknown installScope label: ${labels.installScope}`);
    }
    if (labels.bloatKind !== undefined && tBloat < 0) {
      throw new Error(`Unknown bloatKind label: ${labels.bloatKind}`);
    }
    if (labels.action !== undefined && tAction < 0) {
      throw new Error(`Unknown action label: ${labels.action}`);
    }

    const targets: readonly [number, number, number] = [
      tScope,
      tBloat,
      tAction,
    ];
    const numSteps = Math.max(1, Math.floor(steps));

    for (let s = 0; s < numSteps; s++) {
      const lr = 0.35 * (1 - (0.3 * s) / numSteps);
      this.sgdStep(x, targets, lr, 1e-4, 0.5);
    }

    addPathToBloom(this.bloom, pathStr);
  }

  /**
   * Serialize the model to an INT8 quantized `.b8p` binary (`magic = "B8GP"`).
   */
  public toBuffer(): Buffer {
    const qW1 = quantizeInt8(this.w1);
    const qW2 = [
      quantizeInt8(this.w2[0]),
      quantizeInt8(this.w2[1]),
      quantizeInt8(this.w2[2]),
    ] as const;

    const headerBytes = 32;
    const w1Bytes = HIDDEN_SIZE * VOCAB_SIZE;
    const b1Bytes = HIDDEN_SIZE * 4;
    let headsBytes = 0;
    for (let h = 0; h < 3; h++) {
      headsBytes += HEAD_SIZES[h] * HIDDEN_SIZE + HEAD_SIZES[h] * 4;
    }
    const totalBytes =
      headerBytes + w1Bytes + b1Bytes + headsBytes + BLOOM_BYTES;

    const buf = Buffer.alloc(totalBytes);
    let offset = 0;

    buf.write(MAGIC_STR, offset, 4, 'ascii');
    offset += 4;
    buf.writeUInt16LE(FORMAT_VERSION, offset);
    offset += 2;
    buf.writeUInt16LE(VOCAB_SIZE, offset);
    offset += 2;
    buf.writeUInt16LE(HIDDEN_SIZE, offset);
    offset += 2;
    buf.writeUInt16LE(3, offset);
    offset += 2;
    buf.writeUInt16LE(BLOOM_BYTES, offset);
    offset += 2;
    // Reserved 2 bytes (kept 0 for 4-byte alignment)
    buf.writeUInt16LE(0, offset);
    offset += 2;

    // Quantization scales (4 x float32 = 16 bytes -> total header = 32 bytes)
    buf.writeFloatLE(qW1.scale, offset);
    offset += 4;
    for (let h = 0; h < 3; h++) {
      buf.writeFloatLE(qW2[h].scale, offset);
      offset += 4;
    }

    // W1 (INT8)
    for (let i = 0; i < qW1.quantized.length; i++) {
      buf.writeInt8(qW1.quantized[i], offset++);
    }

    // b1 (FP32)
    for (let i = 0; i < this.b1.length; i++) {
      buf.writeFloatLE(this.b1[i], offset);
      offset += 4;
    }

    // Heads W2 (INT8) + b2 (FP32)
    for (let h = 0; h < 3; h++) {
      const q = qW2[h].quantized;
      for (let i = 0; i < q.length; i++) {
        buf.writeInt8(q[i], offset++);
      }
      const b = this.b2[h];
      for (let i = 0; i < b.length; i++) {
        buf.writeFloatLE(b[i], offset);
        offset += 4;
      }
    }

    // Bloom filter bitset
    buf.set(this.bloom, offset);
    return buf;
  }

  /**
   * Deserialize from an INT8 `.b8p` buffer (`magic = "B8GP"`).
   */
  public static fromBuffer(
    buf: Buffer,
    defaultPath: string = DEFAULT_MODEL_PATH,
  ): SoftwarePathModel {
    if (buf.length < 32) {
      throw new Error(`Invalid .b8p model buffer: too short (${buf.length} B)`);
    }
    const magic = buf.subarray(0, 4).toString('ascii');
    if (magic !== MAGIC_STR) {
      throw new Error(
        `Invalid .b8p model magic: expected "${MAGIC_STR}", got "${magic}"`,
      );
    }

    const version = buf.readUInt16LE(4);
    if (version !== FORMAT_VERSION) {
      throw new Error(`Unsupported .b8p model version: ${version}`);
    }
    const vocab = buf.readUInt16LE(6);
    const hidden = buf.readUInt16LE(8);
    const numHeads = buf.readUInt16LE(10);
    const bloomBytes = buf.readUInt16LE(12);

    if (
      vocab !== VOCAB_SIZE ||
      hidden !== HIDDEN_SIZE ||
      numHeads !== 3 ||
      bloomBytes !== BLOOM_BYTES
    ) {
      throw new Error(
        `Model dimension mismatch: V=${vocab}, H=${hidden}, heads=${numHeads}, bloom=${bloomBytes}`,
      );
    }

    let offset = 16;
    const w1Scale = buf.readFloatLE(offset);
    offset += 4;
    const w2Scales: [number, number, number] = [
      buf.readFloatLE(offset),
      buf.readFloatLE(offset + 4),
      buf.readFloatLE(offset + 8),
    ];
    offset += 12;

    const w1Count = HIDDEN_SIZE * VOCAB_SIZE;
    const qW1 = new Int8Array(w1Count);
    for (let i = 0; i < w1Count; i++) {
      qW1[i] = buf.readInt8(offset++);
    }
    const w1 = dequantizeInt8(qW1, w1Scale);

    const b1 = new Float32Array(HIDDEN_SIZE);
    for (let i = 0; i < HIDDEN_SIZE; i++) {
      b1[i] = buf.readFloatLE(offset);
      offset += 4;
    }

    const w2List: Float32Array[] = [];
    const b2List: Float32Array[] = [];
    for (let h = 0; h < 3; h++) {
      const wCount = HEAD_SIZES[h] * HIDDEN_SIZE;
      const qW = new Int8Array(wCount);
      for (let i = 0; i < wCount; i++) {
        qW[i] = buf.readInt8(offset++);
      }
      w2List.push(dequantizeInt8(qW, w2Scales[h]));

      const b = new Float32Array(HEAD_SIZES[h]);
      for (let i = 0; i < HEAD_SIZES[h]; i++) {
        b[i] = buf.readFloatLE(offset);
        offset += 4;
      }
      b2List.push(b);
    }

    const bloom = new Uint8Array(BLOOM_BYTES);
    bloom.set(buf.subarray(offset, offset + BLOOM_BYTES));

    return new SoftwarePathModel(
      w1,
      b1,
      [w2List[0], w2List[1], w2List[2]],
      [b2List[0], b2List[1], b2List[2]],
      bloom,
      defaultPath,
    );
  }

  /**
   * Save quantized INT8 `.b8p` artifact to disk.
   */
  public save(outPath?: string): void {
    const targetPath = outPath ?? this.defaultPath;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, this.toBuffer());
  }
}

/**
 * Load a quantized `.b8p` model from disk.
 */
export function loadPathModel(
  modelPath: string = DEFAULT_MODEL_PATH,
): SoftwarePathModel {
  const buf = fs.readFileSync(modelPath);
  return SoftwarePathModel.fromBuffer(buf, modelPath);
}

/**
 * Train the shared-encoder 3-head MLP for 80 deterministic epochs via
 * multi-task SGD + L2 decay, quantize to INT8 `.b8p`, save to disk,
 * and report held-out validation accuracy on the quantized model.
 */
export function trainPathModel(
  outPath: string = DEFAULT_MODEL_PATH,
): TrainPathModelResult {
  const rng = createRng(0x5eedb861);

  const w1 = new Float32Array(HIDDEN_SIZE * VOCAB_SIZE);
  const w1ScaleInit = Math.sqrt(2 / VOCAB_SIZE);
  for (let i = 0; i < w1.length; i++) {
    w1[i] = (rng() * 2 - 1) * w1ScaleInit;
  }
  const b1 = new Float32Array(HIDDEN_SIZE);

  const w2: [Float32Array, Float32Array, Float32Array] = [
    new Float32Array(HEAD_SIZES[0] * HIDDEN_SIZE),
    new Float32Array(HEAD_SIZES[1] * HIDDEN_SIZE),
    new Float32Array(HEAD_SIZES[2] * HIDDEN_SIZE),
  ];
  const w2ScaleInit = Math.sqrt(1 / HIDDEN_SIZE);
  for (let h = 0; h < 3; h++) {
    for (let i = 0; i < w2[h].length; i++) {
      w2[h][i] = (rng() * 2 - 1) * w2ScaleInit;
    }
  }
  const b2: [Float32Array, Float32Array, Float32Array] = [
    new Float32Array(HEAD_SIZES[0]),
    new Float32Array(HEAD_SIZES[1]),
    new Float32Array(HEAD_SIZES[2]),
  ];

  const bloom = new Uint8Array(BLOOM_BYTES);

  // Pre-extract features and label indices for fast deterministic training
  interface EncodedSample {
    readonly x: Float32Array;
    readonly targets: readonly [number, number, number];
  }

  const encodeSample = (sample: PathSample): EncodedSample => ({
    x: extractFeatures(sample.path),
    targets: [
      labelIndex('installScope', sample.installScope),
      labelIndex('bloatKind', sample.bloatKind),
      labelIndex('action', sample.action),
    ],
  });

  const trainEncoded: EncodedSample[] = PATH_TRAIN_SAMPLES.map((s) => {
    addPathToBloom(bloom, s.path);
    return encodeSample(s);
  });

  const model = new SoftwarePathModel(w1, b1, w2, b2, bloom, outPath);

  const epochs = 80;
  const baseLr = 0.22;
  const minLr = 0.04;
  const l2Decay = 1e-4;
  const order = new Int32Array(trainEncoded.length);
  for (let i = 0; i < order.length; i++) order[i] = i;

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Deterministic Fisher-Yates shuffle
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    const progress = epoch / Math.max(1, epochs - 1);
    const lr = baseLr * (1 - progress) + minLr * progress;

    for (let i = 0; i < order.length; i++) {
      const sample = trainEncoded[order[i]];
      model.sgdStep(sample.x, sample.targets, lr, l2Decay, 1.0);
    }
  }

  // Quantize and persist `.b8p`
  model.save(outPath);
  const stat = fs.statSync(outPath);

  // Reload quantized model so reported validation accuracy matches deployed INT8 weights
  const quantizedModel = loadPathModel(outPath);

  const correct: Record<PathHeadName, number> = {
    installScope: 0,
    bloatKind: 0,
    action: 0,
  };

  for (let i = 0; i < PATH_VAL_SAMPLES.length; i++) {
    const sample = PATH_VAL_SAMPLES[i];
    const pred = quantizedModel.classifyPath(sample.path);
    if (pred.installScope.label === sample.installScope) {
      correct.installScope++;
    }
    if (pred.bloatKind.label === sample.bloatKind) {
      correct.bloatKind++;
    }
    if (pred.action.label === sample.action) {
      correct.action++;
    }
  }

  const totalVal = Math.max(1, PATH_VAL_SAMPLES.length);
  const valAccuracy: Record<PathHeadName, number> = {
    installScope: correct.installScope / totalVal,
    bloatKind: correct.bloatKind / totalVal,
    action: correct.action / totalVal,
  };

  let sumAcc = 0;
  for (let i = 0; i < HEAD_NAMES.length; i++) {
    sumAcc += valAccuracy[HEAD_NAMES[i]];
  }
  const overallValAccuracy = sumAcc / HEAD_NAMES.length;

  return {
    modelPath: outPath,
    sizeBytes: stat.size,
    valAccuracy,
    overallValAccuracy,
  };
}
