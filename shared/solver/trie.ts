export interface TrieNode {
  children: Record<string, TrieNode>;
  isWord: boolean;
}

export class Trie {
  root: TrieNode = { children: {}, isWord: false };
  size: number = 0;

  insert(word: string): void {
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

  hasWord(word: string): boolean {
    const node = this.getNode(word);
    return !!node && node.isWord;
  }

  hasPrefix(prefix: string): boolean {
    return this.getNode(prefix) !== null;
  }

  getNode(prefix: string): TrieNode | null {
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

  static fromWords(words: string[]): Trie {
    const trie = new Trie();
    for (const w of words) {
      trie.insert(w);
    }
    return trie;
  }
}
