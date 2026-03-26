import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KhemaTranslitService {

  // Map of basic Latin consonants to Gurung Khema Unicode Hex codes
  // Phonetic maps sorted by length descending for greedy matching
  private readonly CONSONANTS: Record<string, string> = {
    'chh': '\uD818\uDD07',
    'tth': '\uD818\uDD0C',
    'ddh': '\uD818\uDD0E',
    'kh': '\uD818\uDD02',
    'gh': '\uD818\uDD04',
    'ng': '\uD818\uDD05',
    'ch': '\uD818\uDD07',
    'jh': '\uD818\uDD09',
    'tt': '\uD818\uDD0B',
    'dd': '\uD818\uDD0D',
    'th': '\uD818\uDD11',
    'dh': '\uD818\uDD13',
    'ph': '\uD818\uDD16',
    'bh': '\uD818\uDD18',
    'k': '\uD818\uDD01',
    'g': '\uD818\uDD03',
    'c': '\uD818\uDD06',
    'j': '\uD818\uDD08',
    'h': '\uD818\uDD0A',
    'v': '\uD818\uDD0F',
    'w': '\uD818\uDD0F',
    't': '\uD818\uDD10',
    'd': '\uD818\uDD12',
    'n': '\uD818\uDD14',
    'p': '\uD818\uDD15',
    'f': '\uD818\uDD16',
    'b': '\uD818\uDD17',
    'm': '\uD818\uDD19',
    'y': '\uD818\uDD1A',
    'r': '\uD818\uDD1B',
    'l': '\uD818\uDD1C',
    's': '\uD818\uDD1D',
    'q': '\uD818\uDD01',
    'z': '\uD818\uDD08',
    'x': '\uD818\uDD07',
  };

  private readonly VOWELS: Record<string, string> = {
    'aa': '\uD818\uDD1E', // 1611E
    'ii': '\uD818\uDD20', // 16120
    'uu': '\uD818\uDD22', // 16122
    'ee': '\uD818\uDD24', // 16124
    'ai': '\uD818\uDD25', // 16125 (Precomposed AI)
    'oo': '\uD818\uDD27', // 16127
    'au': '\uD818\uDD28', // 16128 (Precomposed AU with double bar)
    'i': '\uD818\uDD1F',  // 1611F
    'u': '\uD818\uDD21',  // 16121
    'e': '\uD818\uDD23', // 16123
    'o': '\uD818\uDD26', // 16126
    'a': '' // The inherent vowel 'a' produces no extra mark, but triggers LETTER A if at beginning
  };

  private readonly LETTER_A = '\uD818\uDD00'; // Base carrier for independent vowels
  private readonly THOLHOMA = '\uD818\uDD2F'; // Sign Tholhoma (1612F)
  private readonly ANUSVARA = '\uD818\uDD2D'; // Sign Anusvara (1612D)
  private readonly SPACE = ' ';

  private REVERSE_MAP: { match: string; eng: string; type: string }[] = [];
  private readonly REVERSE_SIGNS: Record<string, string> = {
    '\uD818\uDD30': '0', '\uD818\uDD31': '1', '\uD818\uDD32': '2', '\uD818\uDD33': '3',
    '\uD818\uDD34': '4', '\uD818\uDD35': '5', '\uD818\uDD36': '6', '\uD818\uDD37': '7',
    '\uD818\uDD38': '8', '\uD818\uDD39': '9',
    '\uD818\uDD29': '[length]', '\uD818\uDD2A': '[ya]', '\uD818\uDD2B': '[va]',
    '\uD818\uDD2C': '[ha]', '\uD818\uDD2D': 'n', '\uD818\uDD2E': '[ra]'
  };

  private initReverseMap() {
    if (this.REVERSE_MAP.length > 0) return;

    // 1. Add VOWELS
    for (const [eng, val] of Object.entries(this.VOWELS)) {
      if (val) this.REVERSE_MAP.push({ match: val, eng: eng, type: 'vowel' });
    }
    // 2. Add CONSONANTS
    for (const [eng, val] of Object.entries(this.CONSONANTS)) {
      this.REVERSE_MAP.push({ match: val, eng: eng, type: 'consonant' });
    }
    // 3. Add explicit markers and extra signs
    this.REVERSE_MAP.push({ match: this.THOLHOMA, eng: '[THO]', type: 'marker' });
    this.REVERSE_MAP.push({ match: this.LETTER_A, eng: '[A]', type: 'marker' });
    for (const [val, eng] of Object.entries(this.REVERSE_SIGNS)) {
      this.REVERSE_MAP.push({ match: val, eng: eng, type: 'sign' });
    }

    this.REVERSE_MAP.sort((a, b) => b.match.length - a.match.length);
  }

  private findLongestReverseMatch(input: string, startIndex: number) {
    for (const item of this.REVERSE_MAP) {
      if (input.startsWith(item.match, startIndex)) {
        return item;
      }
    }
    return null;
  }

  public reverseTransliterate(input: string): string {
    this.initReverseMap();
    let result = '';
    let i = 0;

    while (i < input.length) {
      if (input[i] === ' ' || input[i] === '\n' || input[i] === '\t') {
        result += input[i];
        i++;
        continue;
      }

      let matched = this.findLongestReverseMatch(input, i);
      if (matched) {
        if (matched.eng === '[A]') {
          let nextIdx = i + matched.match.length;
          let nextMatch = this.findLongestReverseMatch(input, nextIdx);
          if (nextMatch && nextMatch.type === 'vowel') {
            result += nextMatch.eng;
            i = nextIdx + nextMatch.match.length;
            continue;
          } else {
            result += 'a';
            i += matched.match.length;
            continue;
          }
        } else if (matched.type === 'consonant') {
          let nextIdx = i + matched.match.length;
          let nextMatch = this.findLongestReverseMatch(input, nextIdx);
          if (nextMatch && nextMatch.eng === '[THO]') {
            result += matched.eng;
            i = nextIdx + nextMatch.match.length;
            continue;
          } else if (nextMatch && nextMatch.type === 'vowel') {
            result += matched.eng + nextMatch.eng;
            i = nextIdx + nextMatch.match.length;
            continue;
          } else {
            result += matched.eng + 'a';
            i += matched.match.length;
            continue;
          }
        } else {
          result += (matched.type === 'sign' || matched.type === 'marker') ? matched.eng : matched.eng;
          i += matched.match.length;
          continue;
        }
      } else {
        result += input[i];
        i++;
      }
    }
    return result;
  }

  constructor() { }

  /**
   * Main entry point to convert Latin strings to Gurung Khema
   * @param input Latin string (e.g. "gurung")
   * @returns Transliterated Gurung Khema string
   */
  public transliterate(input: string): string {
    input = input.toLowerCase();
    let result = '';
    let i = 0;

    // State to track if the last emitted character was a base consonant.
    // If it was, and the next character is ALSO a consonant, we must insert the THOLHOMA 
    // to kill the inherent 'a'. If the next char is a vowel, we just append the dependent Matra sign.
    let lastWasConsonant = false;

    while (i < input.length) {
      if (input[i] === ' ' || input[i] === '\n' || input[i] === '\t') {
        result += input[i];
        lastWasConsonant = false;
        i++;
        continue;
      }

      // 1. Try to match the longest Vowel first (e.g. 'aa' before 'a')
      let matchedVowel = this.findLongestMatch(input, i, this.VOWELS);
      if (matchedVowel) {
        // If it's a vowel at the start of a syllable (e.g. 'Abiral'), we must insert LETTER A first!
        if (!lastWasConsonant) {
          result += this.LETTER_A;
        }

        // Then append the dependent vowel sign (if any)
        result += this.VOWELS[matchedVowel];
        lastWasConsonant = false;
        i += matchedVowel.length;
        continue;
      }

      // 2. Specialized Anusvara rule (nasal sound 'n' or 'm' at the end of a syllable)
      // Usually represented as 'm' or 'n' before another consonant.
      // E.g. "gurung" -> if "ng" isn't matched as a consonant, or if "n" is trailing.
      // (Skipping complex Anusvara lookaheads for now, treating it as a standard consonant if unmapped).

      // 3. Try to match the longest Consonant (e.g. 'chha' before 'cha')
      let matchedConsonant = this.findLongestMatch(input, i, this.CONSONANTS);
      if (matchedConsonant) {
        // THOLHOMA RULE: If two consonants appear back to back (without a vowel between them),
        // the first consonant's inherent 'a' sound must be killed.
        // e.g. "kt" -> "ka" + THOLHOMA + "ta".
        if (lastWasConsonant) {
          result += this.THOLHOMA;
        }

        result += this.CONSONANTS[matchedConsonant];

        lastWasConsonant = true;
        i += matchedConsonant.length;
        continue;
      }

      // Fallback: If no match, just append the character and move on
      result += input[i];
      lastWasConsonant = false;
      i++;
    }

    // Word-final consonant killer rule
    if (lastWasConsonant) {
      result += this.THOLHOMA;
    }

    return result;
  }

  private findLongestMatch(input: string, startIndex: number, dictionary: Record<string, string>): string | null {
    // Check lengths 4 down to 1 (e.g. 'chha' is 4)
    for (let len = 4; len > 0; len--) {
      if (startIndex + len <= input.length) {
        const sub = input.substr(startIndex, len);
        if (dictionary.hasOwnProperty(sub)) {
          return sub;
        }
      }
    }
    return null;
  }
}
