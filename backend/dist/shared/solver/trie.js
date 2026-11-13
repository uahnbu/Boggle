"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trie = void 0;
class Trie {
    root = { children: {}, isWord: false };
    size = 0;
    insert(word) {
        const upper = word.toUpperCase();
        let current = this.root;
        for (let i = 0; i < upper.length; i++) {
            const char = upper[i];
            if (!current.children[char]) {
                current.children[char] = { children: {}, isWord: false };
            }
            current = current.children[char];
        }
        if (!current.isWord) {
            current.isWord = true;
            this.size++;
        }
    }
    hasWord(word) {
        const node = this.getNode(word);
        return !!node && node.isWord;
    }
    hasPrefix(prefix) {
        return this.getNode(prefix) !== null;
    }
    getNode(prefix) {
        const upper = prefix.toUpperCase();
        let current = this.root;
        for (let i = 0; i < upper.length; i++) {
            const char = upper[i];
            if (!current.children[char]) {
                return null;
            }
            current = current.children[char];
        }
        return current;
    }
    static fromWords(words) {
        const trie = new Trie();
        for (const w of words) {
            trie.insert(w);
        }
        return trie;
    }
}
exports.Trie = Trie;
