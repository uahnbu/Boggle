import fs from 'fs';
import path from 'path';
import { Trie } from '../../../shared/solver/trie';

export interface WordMetadata {
  tier: 'A' | 'B' | 'C' | 'D';
  length: number;
  rank: number;
  def?: string;
}

export class DictionaryService {
  private static instance: DictionaryService;
  private trie: Trie;
  private wordSet: Set<string>;
  private metadata: Map<string, WordMetadata>;
  public readonly version: string = '1.0.0-curated';

  private constructor() {
    this.trie = new Trie();
    this.wordSet = new Set();
    this.metadata = new Map();
    this.loadDictionary();
  }

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  private loadDictionary() {
    const baseDir = path.resolve(process.cwd(), '..', 'dictionary');
    // Fallback if running from root
    const resolvedDir = fs.existsSync(baseDir) ? baseDir : path.resolve(process.cwd(), 'dictionary');

    console.log(`[DictionaryService] Loading dictionary from: ${resolvedDir}`);
    const t0 = Date.now();

    // 1. Load words (single source of truth)
    const wordsPath = path.join(resolvedDir, 'words.json');
    if (fs.existsSync(wordsPath)) {
      const wordsArr: string[] = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
      for (const w of wordsArr) {
        const upper = w.toUpperCase();
        this.trie.insert(upper);
        this.wordSet.add(upper);
      }
    }

    // 2. Load metadata
    const metadataPath = path.join(resolvedDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metaObj: Record<string, WordMetadata> = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      for (const [w, data] of Object.entries(metaObj)) {
        this.metadata.set(w.toUpperCase(), data);
      }
    }

    console.log(`[DictionaryService] Loaded ${this.wordSet.size} valid words into Trie & Set in ${Date.now() - t0}ms`);
  }

  public hasWord(word: string): boolean {
    const upper = word.toUpperCase().trim();
    return this.wordSet.has(upper);
  }

  public hasPrefix(prefix: string): boolean {
    return this.trie.hasPrefix(prefix.toUpperCase().trim());
  }

  public getMetadata(word: string): WordMetadata | undefined {
    const upper = word.toUpperCase().trim();
    const direct = this.metadata.get(upper);
    if (direct) return direct;

    // Check inflections
    const candidates = [
      { suffix: 'S', base: upper.slice(0, -1), prefix: 'Plural of ' },
      { suffix: 'ES', base: upper.slice(0, -2), prefix: 'Plural / form of ' },
      { suffix: 'IES', base: upper.slice(0, -3) + 'Y', prefix: 'Plural of ' },
      { suffix: 'ED', base: upper.slice(0, -2), prefix: 'Past tense of ' },
      { suffix: 'ED', base: upper.slice(0, -1), prefix: 'Past tense of ' },
      { suffix: 'ING', base: upper.slice(0, -3), prefix: 'Present participle of ' },
      { suffix: 'ING', base: upper.slice(0, -3) + 'E', prefix: 'Present participle of ' },
      { suffix: 'ER', base: upper.slice(0, -2), prefix: 'Agent / comparative form of ' },
      { suffix: 'ERS', base: upper.slice(0, -3), prefix: 'Plural of ' },
    ];

    for (const c of candidates) {
      if (upper.endsWith(c.suffix) && c.base.length >= 3) {
        const baseMeta = this.metadata.get(c.base);
        if (baseMeta) {
          return {
            tier: baseMeta.tier,
            length: upper.length,
            rank: baseMeta.rank,
            def: baseMeta.def ? `${c.prefix}${c.base.toLowerCase()}: ${baseMeta.def}` : `${c.prefix}${c.base.toLowerCase()}`,
          };
        }
      }
    }

    if (this.wordSet.has(upper)) {
      return {
        tier: 'B',
        length: upper.length,
        rank: 500,
        def: 'A recognized English word.',
      };
    }

    return undefined;
  }

  public getTrie(): Trie {
    return this.trie;
  }

  public getWordList(): string[] {
    return Array.from(this.wordSet);
  }
}
