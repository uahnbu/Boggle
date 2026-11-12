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
  private exclusions: Set<string>;
  public readonly version: string = '1.0.0-curated';

  private constructor() {
    this.trie = new Trie();
    this.wordSet = new Set();
    this.metadata = new Map();
    this.exclusions = new Set();
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

    // 1. Load exclusions
    const exclusionsPath = path.join(resolvedDir, 'exclusions.json');
    if (fs.existsSync(exclusionsPath)) {
      const excArr: string[] = JSON.parse(fs.readFileSync(exclusionsPath, 'utf-8'));
      for (const e of excArr) {
        this.exclusions.add(e.toUpperCase());
      }
    }

    // 2. Load words
    const wordsPath = path.join(resolvedDir, 'words.json');
    if (fs.existsSync(wordsPath)) {
      const wordsArr: string[] = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
      for (const w of wordsArr) {
        const upper = w.toUpperCase();
        if (!this.exclusions.has(upper)) {
          this.trie.insert(upper);
          this.wordSet.add(upper);
        }
      }
    }

    // 3. Load metadata
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
    if (this.exclusions.has(upper)) return false;
    return this.wordSet.has(upper);
  }

  public hasPrefix(prefix: string): boolean {
    return this.trie.hasPrefix(prefix.toUpperCase().trim());
  }

  public getMetadata(word: string): WordMetadata | undefined {
    return this.metadata.get(word.toUpperCase().trim());
  }

  public getTrie(): Trie {
    return this.trie;
  }

  public getWordList(): string[] {
    return Array.from(this.wordSet);
  }
}
