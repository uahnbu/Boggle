import { useState, useEffect, useRef } from 'react';
import { Trie } from '@shared/solver/trie';

export interface WordMetadata {
  tier: 'A' | 'B' | 'C' | 'D';
  length: number;
  rank: number;
  def?: string;
}

export function useDictionary() {
  const [isLoaded, setIsLoaded] = useState(false);
  const trieRef = useRef<Trie>(new Trie());
  const wordsSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/api/dictionary/words');
        if (!res.ok) throw new Error('Failed to fetch words');
        const words: string[] = await res.json();
        if (isMounted) {
          const trie = Trie.fromWords(words);
          trieRef.current = trie;
          wordsSetRef.current = new Set(words.map(w => w.toUpperCase()));
          setIsLoaded(true);
          console.log(`[useDictionary] Client-side dictionary loaded: ${words.length} words`);
        }
      } catch (err) {
        console.warn('[useDictionary] Could not load client dictionary file, relying on server validation fallback:', err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasWord = (word: string): boolean => {
    return wordsSetRef.current.has(word.toUpperCase().trim());
  };

  const hasPrefix = (prefix: string): boolean => {
    return trieRef.current.hasPrefix(prefix.toUpperCase().trim());
  };

  const lookupDefinition = async (word: string): Promise<WordMetadata | null> => {
    try {
      const res = await fetch(`/api/dictionary/word/${encodeURIComponent(word)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.metadata;
    } catch {
      return null;
    }
  };

  return {
    isLoaded,
    hasWord,
    hasPrefix,
    lookupDefinition,
  };
}
