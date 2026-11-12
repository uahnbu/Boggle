import urllib.request
import json
import os

def clean_dictionary():
    print("Curating clean dictionary...")
    url_en = 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt'
    req = urllib.request.Request(url_en, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as r:
        enable1 = set(line.decode('utf-8').strip().upper() for line in r if line.strip())

    dict_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(dict_dir, 'metadata.json'), 'r', encoding='utf-8') as f:
        meta = json.load(f)

    # 1. Whitelist of real, universally recognized 3-letter English words
    COMMON_3_LETTER_WORDS = set([
        'ACE', 'ACT', 'ADD', 'AGE', 'AGO', 'AID', 'AIM', 'AIR', 'ALE', 'ALL', 'AND', 'ANT', 'ANY', 'APE', 'APT', 'ARC', 'ARE', 'ARK', 'ARM', 'ART', 'ASH', 'ASK', 'ATE', 'AWE', 'AXE', 'AYE',
        'BAD', 'BAG', 'BAN', 'BAR', 'BAT', 'BAY', 'BED', 'BEE', 'BEG', 'BET', 'BID', 'BIG', 'BIN', 'BIT', 'BOA', 'BOB', 'BOG', 'BOO', 'BOW', 'BOX', 'BOY', 'BRA', 'BUD', 'BUG', 'BUM', 'BUN', 'BUS', 'BUT', 'BUY', 'BYE',
        'CAB', 'CAM', 'CAN', 'CAP', 'CAR', 'CAT', 'COB', 'COD', 'COG', 'CON', 'COP', 'COT', 'COW', 'COY', 'CRY', 'CUB', 'CUD', 'CUE', 'CUP', 'CUR', 'CUT',
        'DAD', 'DAM', 'DAY', 'DEN', 'DEW', 'DIE', 'DIG', 'DIM', 'DIN', 'DIP', 'DOE', 'DOG', 'DON', 'DOT', 'DRY', 'DUB', 'DUE', 'DUG', 'DYE',
        'EAR', 'EAT', 'EBB', 'EEL', 'EGG', 'EGO', 'ELK', 'ELM', 'EMU', 'END', 'ERA', 'EVE', 'EYE',
        'FAN', 'FAR', 'FAT', 'FED', 'FEE', 'FEW', 'FIG', 'FIN', 'FIR', 'FIT', 'FIX', 'FLU', 'FLY', 'FOE', 'FOG', 'FOR', 'FOX', 'FRY', 'FUN', 'FUR',
        'GAG', 'GAP', 'GAS', 'GAY', 'GEL', 'GEM', 'GET', 'GIG', 'GIN', 'GNU', 'GOD', 'GOT', 'GUM', 'GUN', 'GUT', 'GUY', 'GYM',
        'HAD', 'HAM', 'HAS', 'HAT', 'HAY', 'HEM', 'HEN', 'HER', 'HEW', 'HEX', 'HID', 'HIM', 'HIP', 'HIS', 'HIT', 'HOG', 'HOP', 'HOT', 'HOW', 'HUB', 'HUE', 'HUG', 'HUM', 'HUT',
        'ICE', 'ICY', 'ILL', 'INK', 'INN', 'ION', 'IRE', 'IRK', 'IVY',
        'JAB', 'JAM', 'JAR', 'JAW', 'JAY', 'JET', 'JIG', 'JOB', 'JOG', 'JOY', 'JUG', 'JUT',
        'KEG', 'KEY', 'KID', 'KIN', 'KIT',
        'LAB', 'LAD', 'LAG', 'LAP', 'LAW', 'LAY', 'LED', 'LEE', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LIT', 'LOG', 'LOT', 'LOW', 'LUG',
        'MAD', 'MAN', 'MAP', 'MAT', 'MAW', 'MAY', 'MEN', 'MET', 'MID', 'MIX', 'MOB', 'MOP', 'MUD', 'MUG',
        'NAG', 'NAP', 'NET', 'NEW', 'NIP', 'NOD', 'NON', 'NOT', 'NOW', 'NUN', 'NUT',
        'OAF', 'OAK', 'OAR', 'OAT', 'ODD', 'OFF', 'OIL', 'OLD', 'ONE', 'OPT', 'ORE', 'OUR', 'OUT', 'OWL', 'OWN',
        'PAD', 'PAL', 'PAN', 'PAT', 'PAW', 'PAY', 'PEA', 'PEG', 'PEN', 'PEP', 'PER', 'PET', 'PEW', 'PIE', 'PIG', 'PIN', 'PIP', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'PRO', 'PRY', 'PUB', 'PUG', 'PUN', 'PUP', 'PUT',
        'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROE', 'ROT', 'ROW', 'RUB', 'RUG', 'RUN', 'RUT', 'RYE',
        'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SEE', 'SET', 'SEW', 'SHE', 'SHY', 'SIN', 'SIP', 'SIR', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SOD', 'SON', 'SOW', 'SOY', 'SPA', 'SPY', 'SUB', 'SUE', 'SUM', 'SUN',
        'TAB', 'TAG', 'TAN', 'TAP', 'TAR', 'TAX', 'TEA', 'TEN', 'THE', 'TIE', 'TIN', 'TIP', 'TOE', 'TON', 'TOO', 'TOP', 'TOW', 'TOY', 'TRY', 'TUB', 'TUG', 'TWO',
        'URN', 'USE',
        'VAN', 'VAT', 'VET', 'VIA', 'VOW',
        'WAG', 'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WED', 'WEE', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT', 'WOE', 'WON',
        'YAK', 'YAM', 'YAP', 'YEA', 'YES', 'YET', 'YEW', 'YIP', 'YOU',
        'ZAP', 'ZIP', 'ZOO'
    ])

    # 2. Explicit blacklist of junk, slang, and abbreviations
    BLACKLIST = set([
        'PHOT', 'TOIT', 'PONT', 'HON', 'NIT', 'HIN', 'AET', 'LEN', 'ONT', 'INT', 'TUM', 'RIT', 'HIR', 'WEN', 'THA', 'TUN', 'PON', 'MUT',
        'BAIYUN', 'BIONDI', 'DEVENS', 'DITTON', 'DITTOS', 'EMCEED', 'LOTTOS',
        'REI', 'REN', 'OOT', 'OTO', 'OES', 'TOU', 'AUD', 'AUF', 'ODA', 'TIT', 'TST', 'TSI', 'REA', 'RYA', 'ERN',
        'CWM', 'CWMS', 'CRWTH', 'CRWTHS', 'SUQ', 'SUQS', 'QAT', 'QATS', 'QOPH', 'QOPHS',
        'DITS', 'KHET', 'CETE', 'DAUT', 'FRAP', 'FROT', 'GROT', 'LUCE', 'SNIT', 'ZATI', 'ZEPS', 'ZOEA',
        'AAA', 'ABC', 'ACLU', 'ADDR', 'AMDT', 'AMEX', 'HTML', 'HTTP', 'HTTPS', 'JPEG', 'JSON', 'WIFI',
        'URL', 'COM', 'ORG', 'NET', 'GOV', 'EDU', 'JPG', 'PNG', 'GIF', 'EXE', 'DLL'
    ])

    final_words = []
    final_meta = {}

    for word, data in meta.items():
        if word in BLACKLIST:
            continue
        
        l = len(word)
        if l == 3:
            if word in COMMON_3_LETTER_WORDS:
                final_words.append(word)
                final_meta[word] = data
        elif l >= 4:
            if word in enable1:
                final_words.append(word)
                final_meta[word] = data

    final_words.sort()

    with open(os.path.join(dict_dir, 'words.json'), 'w', encoding='utf-8') as f:
        json.dump(final_words, f)

    with open(os.path.join(dict_dir, 'exclusions.json'), 'w', encoding='utf-8') as f:
        json.dump(sorted(list(BLACKLIST)), f, indent=2)

    with open(os.path.join(dict_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
        json.dump(final_meta, f)

    print(f"Cleaned dictionary successfully saved! Total words: {len(final_words)}")

if __name__ == '__main__':
    clean_dictionary()
