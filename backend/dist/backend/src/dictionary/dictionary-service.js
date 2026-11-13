"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionaryService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const trie_1 = require("../../../shared/solver/trie");
class DictionaryService {
    static instance;
    trie;
    wordSet;
    metadata;
    version = '1.0.0-curated';
    constructor() {
        this.trie = new trie_1.Trie();
        this.wordSet = new Set();
        this.metadata = new Map();
        this.loadDictionary();
    }
    static getInstance() {
        if (!DictionaryService.instance) {
            DictionaryService.instance = new DictionaryService();
        }
        return DictionaryService.instance;
    }
    loadDictionary() {
        const baseDir = path_1.default.resolve(process.cwd(), '..', 'dictionary');
        // Fallback if running from root
        const resolvedDir = fs_1.default.existsSync(baseDir) ? baseDir : path_1.default.resolve(process.cwd(), 'dictionary');
        console.log(`[DictionaryService] Loading dictionary from: ${resolvedDir}`);
        const t0 = Date.now();
        // 1. Load words (single source of truth)
        const wordsPath = path_1.default.join(resolvedDir, 'words.json');
        if (fs_1.default.existsSync(wordsPath)) {
            const wordsArr = JSON.parse(fs_1.default.readFileSync(wordsPath, 'utf-8'));
            for (const w of wordsArr) {
                const upper = w.toUpperCase();
                this.trie.insert(upper);
                this.wordSet.add(upper);
            }
        }
        // 2. Load metadata
        const metadataPath = path_1.default.join(resolvedDir, 'metadata.json');
        if (fs_1.default.existsSync(metadataPath)) {
            const metaObj = JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf-8'));
            for (const [w, data] of Object.entries(metaObj)) {
                this.metadata.set(w.toUpperCase(), data);
            }
        }
        console.log(`[DictionaryService] Loaded ${this.wordSet.size} valid words into Trie & Set in ${Date.now() - t0}ms`);
    }
    hasWord(word) {
        const upper = word.toUpperCase().trim();
        return this.wordSet.has(upper);
    }
    hasPrefix(prefix) {
        return this.trie.hasPrefix(prefix.toUpperCase().trim());
    }
    getMetadata(word) {
        const upper = word.toUpperCase().trim();
        const direct = this.metadata.get(upper);
        if (direct)
            return direct;
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
    getTrie() {
        return this.trie;
    }
    getWordList() {
        return Array.from(this.wordSet);
    }
}
exports.DictionaryService = DictionaryService;
