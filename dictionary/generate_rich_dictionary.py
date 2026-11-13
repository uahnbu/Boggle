import urllib.request
import json
import os
import re

def main():
    print("Fetching comprehensive wordlists...")
    
    # 1. SOWPODS (Collins Scrabble Words) - has comprehensive plurals, tenses, and jobs
    url_sowpods = 'https://raw.githubusercontent.com/jesstess/Scrabble/master/scrabble/sowpods.txt'
    req1 = urllib.request.Request(url_sowpods, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req1, timeout=20) as r:
        sowpods = set(line.decode('utf-8', errors='ignore').strip().upper() for line in r if line.strip())
    print(f"Loaded {len(sowpods)} words from SOWPODS.")

    # 2. ENABLE1
    url_enable1 = 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt'
    req2 = urllib.request.Request(url_enable1, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req2, timeout=20) as r:
        enable1 = set(line.decode('utf-8', errors='ignore').strip().upper() for line in r if line.strip())
    print(f"Loaded {len(enable1)} words from ENABLE1.")

    # Merge base pool
    pool = sowpods.union(enable1)

    # 3. Explicitly ensure modern words, compound words, job titles, and inflections requested by user
    MODERN_AND_INFLECTIONS = [
        # User specified examples:
        'DINES', 'SIT', 'SIS', 'DISSES', 'ASS', 'ASSES', 'NET', 'FEST', 'SNORER',
        'TANNERS', 'PEED', 'PEES', 'FIREFIGHT', 'FIREFIGHTS', 'FIREFIGHTED', 'FIREFIGHTING',
        'FIREFIGHTER', 'FIREFIGHTERS', 'EMAIL', 'EMAILS', 'EMAILED', 'EMAILING',
        'WEBSITE', 'WEBSITES', 'CHICKPEA', 'CHICKPEAS',
        # Additional modern & job words:
        'SMARTPHONE', 'SMARTPHONES', 'PODCAST', 'PODCASTS', 'PODCASTER', 'PODCASTERS', 'PODCASTING',
        'ONLINE', 'OFFLINE', 'INTERNET', 'BROWSER', 'BROWSERS', 'SOFTWARE', 'HARDWARE',
        'BLOG', 'BLOGS', 'BLOGGED', 'BLOGGING', 'BLOGGER', 'BLOGGERS',
        'SELFIE', 'SELFIES', 'HASHTAG', 'HASHTAGS', 'EMOJI', 'EMOJIS',
        'BITCOIN', 'BITCOINS', 'TWEET', 'TWEETS', 'TWEETED', 'TWEETING',
        'LIVESTREAM', 'LIVESTREAMS', 'SCREENSHOT', 'SCREENSHOTS',
        'LOGIN', 'LOGINS', 'LOGOUT', 'LOGOUTS', 'SIGNUP', 'SIGNUPS',
        'FIREWALL', 'FIREWALLS', 'MALWARE', 'SPYWARE', 'DATABASE', 'DATABASES',
        'PLAYLIST', 'PLAYLISTS', 'CYBERSPACE', 'CYBERCRIME', 'CYBERSECURITY',
        'CHATBOT', 'CHATBOTS', 'AVATAR', 'AVATARS', 'PIXEL', 'PIXELS',
        'MEGABYTE', 'MEGABYTES', 'GIGABYTE', 'GIGABYTES', 'TERABYTE', 'TERABYTES',
        'WORKOUT', 'WORKOUTS', 'TAKEOUT', 'TAKEOUTS', 'HOMEPAGE', 'HOMEPAGES',
        'WEBCAST', 'WEBCASTS', 'WEBCAM', 'WEBCAMS', 'WEBMASTER', 'WEBMASTERS',
        'CAREGIVER', 'CAREGIVERS', 'BARTENDER', 'BARTENDERS', 'BABYSITTER', 'BABYSITTERS',
        'PARAMEDIC', 'PARAMEDICS', 'FLIGHT', 'FLIGHTS', 'ASTRONAUT', 'ASTRONAUTS',
        'SCIENTIST', 'SCIENTISTS', 'ENGINEER', 'ENGINEERS', 'DEVELOPER', 'DEVELOPERS',
        'DESIGNER', 'DESIGNERS', 'PROGRAMMER', 'PROGRAMMERS', 'MANAGER', 'MANAGERS',
        'DIRECTOR', 'DIRECTORS', 'INVENTOR', 'INVENTORS', 'CREATOR', 'CREATORS',
        'OPERATOR', 'OPERATORS', 'ACTOR', 'ACTORS', 'ACTRESS', 'ACTRESSES',
        'WRITER', 'WRITERS', 'AUTHOR', 'AUTHORS', 'TEACHER', 'TEACHERS',
        'PROFESSOR', 'PROFESSORS', 'DOCTOR', 'DOCTORS', 'SURGEON', 'SURGEONS',
        'NURSE', 'NURSES', 'DENTIST', 'DENTISTS', 'LAWYER', 'LAWYERS',
        'POLICE', 'OFFICER', 'OFFICERS', 'SOLDIER', 'SOLDIERS', 'PILOT', 'PILOTS'
    ]
    for w in MODERN_AND_INFLECTIONS:
        pool.add(w.upper())

    # 4. Whitelist of universally recognized 3-letter words (strict Scrabble junk filter)
    COMMON_3_LETTER_WORDS = set([
        'ACE', 'ACT', 'ADD', 'AGE', 'AGO', 'AID', 'AIM', 'AIR', 'ALE', 'ALL', 'AND', 'ANT', 'ANY', 'APE', 'APT', 'ARC', 'ARE', 'ARK', 'ARM', 'ART', 'ASH', 'ASK', 'ASS', 'ATE', 'AWE', 'AXE', 'AYE',
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
        'PAD', 'PAL', 'PAN', 'PAT', 'PAW', 'PAY', 'PEA', 'PEE', 'PEG', 'PEN', 'PEP', 'PER', 'PET', 'PEW', 'PIE', 'PIG', 'PIN', 'PIP', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'PRO', 'PRY', 'PUB', 'PUG', 'PUN', 'PUP', 'PUT',
        'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROE', 'ROT', 'ROW', 'RUB', 'RUG', 'RUN', 'RUT', 'RYE',
        'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SEE', 'SET', 'SEW', 'SHE', 'SHY', 'SIN', 'SIP', 'SIR', 'SIS', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SOD', 'SON', 'SOW', 'SOY', 'SPA', 'SPY', 'SUB', 'SUE', 'SUM', 'SUN',
        'TAB', 'TAG', 'TAN', 'TAP', 'TAR', 'TAX', 'TEA', 'TEN', 'THE', 'TIE', 'TIN', 'TIP', 'TOE', 'TON', 'TOO', 'TOP', 'TOW', 'TOY', 'TRY', 'TUB', 'TUG', 'TWO',
        'URN', 'USE',
        'VAN', 'VAT', 'VET', 'VIA', 'VOW',
        'WAG', 'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WED', 'WEE', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT', 'WOE', 'WON',
        'YAK', 'YAM', 'YAP', 'YEA', 'YES', 'YET', 'YEW', 'YIP', 'YOU',
        'ZAP', 'ZIP', 'ZOO'
    ])

    # 5. User Blacklist of Slang, Abbreviations, and Obscure Scrabble Junk
    BLACKLIST = set([
        'PHOT', 'TOIT', 'PONT', 'HON', 'NIT', 'HIN', 'AET', 'LEN', 'ONT', 'INT', 'TUM', 'RIT', 'HIR', 'WEN', 'THA', 'TUN', 'PON', 'MUT',
        'BAIYUN', 'BIONDI', 'DEVENS', 'DITTON', 'DITTOS', 'EMCEED', 'LOTTOS',
        'REI', 'REN', 'OOT', 'OTO', 'OES', 'TOU', 'AUD', 'AUF', 'ODA', 'TIT', 'TST', 'TSI', 'REA', 'RYA', 'ERN',
        'CWM', 'CWMS', 'CRWTH', 'CRWTHS', 'SUQ', 'SUQS', 'QAT', 'QATS', 'QOPH', 'QOPHS',
        'DITS', 'KHET', 'CETE', 'DAUT', 'FRAP', 'FROT', 'GROT', 'LUCE', 'SNIT', 'ZATI', 'ZEPS', 'ZOEA',
        'AAA', 'ABC', 'ACLU', 'ADDR', 'AMDT', 'AMEX', 'HTML', 'HTTP', 'HTTPS', 'JPEG', 'JSON',
        'URL', 'GOV', 'EDU', 'JPG', 'PNG', 'GIF', 'EXE', 'DLL'
    ])

    # Filter wordlist
    final_words = []
    for w in pool:
        if not re.match(r'^[A-Z]+$', w):
            continue
        if w in BLACKLIST:
            continue
        
        l = len(w)
        if l < 3:
            continue
        elif l == 3:
            if w in COMMON_3_LETTER_WORDS:
                final_words.append(w)
        else: # l >= 4
            final_words.append(w)

    final_words.sort()
    print(f"Total curated words: {len(final_words)}")

    dict_dir = os.path.dirname(os.path.abspath(__file__))

    # Save words.json (Single source of truth!)
    words_path = os.path.join(dict_dir, 'words.json')
    with open(words_path, 'w', encoding='utf-8') as f:
        json.dump(final_words, f)

    # Clean up obsolete exclusions.json
    excl_path = os.path.join(dict_dir, 'exclusions.json')
    if os.path.exists(excl_path):
        os.remove(excl_path)
        print("Removed obsolete exclusions.json")

    # Verify user test words
    test_words = [
        'DINES', 'SIT', 'SIS', 'DISSES', 'ASS', 'ASSES', 'NET', 'FEST', 'SNORER',
        'TANNERS', 'PEED', 'PEES', 'FIREFIGHT', 'FIREFIGHTER', 'FIREFIGHTERS', 'EMAIL', 'WEBSITE', 'CHICKPEA'
    ]
    word_set = set(final_words)
    print("\nVerification of user requested words in words.json:")
    for tw in test_words:
        print(f"  {tw}: {'FOUND ✓' if tw in word_set else 'MISSING ✗'}")

    print("\nDictionary build completed successfully!")

if __name__ == '__main__':
    main()
