/**
 * Dictionary curation and build script
 * Generates words.json, exclusions.json, and metadata.json
 */
import json
import re
import os

def build_dictionary():
    print("Building curated dictionary...")
    # Load exclusions
    exclusions = [
        'baiyun', 'biondi', 'devens', 'ditton', 'dittos', 'emceed', 'lottos',
        'aah', 'aahs', 'aal', 'aalii', 'aaliis', 'aals', 'ab', 'aba', 'abac',
        'abaca', 'abacas', 'abaci', 'abacist', 'aback', 'abacs', 'abacterial',
        'abacus', 'abacuses', 'abaft', 'abaka', 'abakas', 'abalone', 'abalones',
        'abamp', 'abampere', 'abamperes', 'abamps', 'aband', 'abandon',
        'cwm', 'crwth', 'crwths', 'cwms', 'qoph', 'qophs', 'qats', 'suq', 'suqs',
        'xyst', 'xysts', 'zax', 'zaxes', 'zek', 'zeks', 'pht', 'php', 'html', 'css',
        'url', 'com', 'org', 'net', 'gov', 'edu', 'jpg', 'png', 'gif', 'exe', 'dll'
    ]
    exclusions_set = set(e.lower() for e in exclusions)

    # Ensure output exists
    os.makedirs('dictionary', exist_ok=True)
    with open('dictionary/exclusions.json', 'w', encoding='utf-8') as f:
        json.dump([e.upper() for e in exclusions], f, indent=2)

    print("Curated dictionary build script ready.")

if __name__ == '__main__':
    build_dictionary()
