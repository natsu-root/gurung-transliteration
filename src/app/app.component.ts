import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KhemaTranslitService } from './services/khema-translit.service';

interface KeyMap {
  char: string;
  rawChar: string;
  eng: string;
  name: string;
  valueToInsert: string;
}

export const GURUNG_KHEMA_NAMES = [
  'LETTER A', 'LETTER KA', 'LETTER KHA', 'LETTER GA', 'LETTER GHA', 'LETTER NGA',
  'LETTER CA', 'LETTER CHA', 'LETTER JA', 'LETTER JHA', 'LETTER HA', 'LETTER TTA',
  'LETTER TTHA', 'LETTER DDA', 'LETTER DDHA', 'LETTER VA', 'LETTER TA', 'LETTER THA',
  'LETTER DA', 'LETTER DHA', 'LETTER NA', 'LETTER PA', 'LETTER PHA', 'LETTER BA',
  'LETTER BHA', 'LETTER MA', 'LETTER YA', 'LETTER RA', 'LETTER LA', 'LETTER SA',
  'VOWEL SIGN AA', 'VOWEL SIGN I', 'VOWEL SIGN II', 'VOWEL SIGN U', 'VOWEL SIGN UU',
  'VOWEL SIGN E', 'VOWEL SIGN EE', 'VOWEL SIGN AI', 'VOWEL SIGN O', 'VOWEL SIGN OO',
  'VOWEL SIGN AU', 'VOWEL LENGTH MARK', 'CONSONANT SIGN MEDIAL YA', 'CONSONANT SIGN MEDIAL VA',
  'CONSONANT SIGN MEDIAL HA', 'SIGN ANUSVARA', 'CONSONANT SIGN MEDIAL RA', 'SIGN THOLHOMA',
  'DIGIT ZERO', 'DIGIT ONE', 'DIGIT TWO', 'DIGIT THREE', 'DIGIT FOUR', 'DIGIT FIVE',
  'DIGIT SIX', 'DIGIT SEVEN', 'DIGIT EIGHT', 'DIGIT NINE',
];

export const PHONETIC_MAPPING = [
  'a', 'k', 'kh', 'g', 'gh', 'ng',
  'c', 'ch', 'j', 'jh', 'h', 'tt',
  'tth', 'dd', 'ddh', 'v', 't', 'th',
  'd', 'dh', 'n', 'p', 'ph', 'b',
  'bh', 'm', 'y', 'r', 'l', 's',
  'aa', 'i', 'ii', 'u', 'uu', 'e',
  'ee', 'ai', 'o', 'oo', 'au',
  '[length]', '[ya]', '[va]', '[ha]', 'n', '[ra]', '[tho]', // Medials and special signs descriptively mapped for UI label
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'gurung-transliteration-app';
  inputText = signal('');
  outputText = signal('');
  isLatinToGurung = signal(true);

  keyboardKeys: KeyMap[] = [];

  private translitService = inject(KhemaTranslitService);

  constructor() {
    // We removed the decomposedKeys manual overrides. 
    // This forces the app to use the correct native precomposed ligatures 
    // for complex vowel signs (like AU) instead of stacking them incorrectly.

    for (let i = 0x16100; i <= 0x16139; i++) {
      const index = i - 0x16100;
      let charStr = String.fromCodePoint(i);

      // Add dotted circle placeholder for combining marks (range 1611E to 1612F) for display on OSK
      const displayChar = (i >= 0x1611E && i <= 0x1612F) ? '\u25CC' + charStr : charStr;

      let insertVal = PHONETIC_MAPPING[index] || '';
      if (index >= 41 && index <= 57) {
        insertVal = charStr; // Insert Gurung Khema character directly for non-descriptive maps
      }

      this.keyboardKeys.push({
        char: displayChar,
        rawChar: charStr,
        eng: PHONETIC_MAPPING[index] || '',
        name: GURUNG_KHEMA_NAMES[index] || '',
        valueToInsert: insertVal
      });
    }
  }

  onTextInput(event: Event): void {
    const element = event.target as HTMLTextAreaElement;
    this.inputText.set(element.value);
    this.updateOutput();
  }

  insertChar(key: KeyMap) {
    const charToAppend = this.isLatinToGurung() ? key.valueToInsert : key.rawChar;
    if (!charToAppend) return;
    this.inputText.update(val => val + charToAppend);
    this.updateOutput();
  }

  insertSpace() {
    this.inputText.update(val => val + ' ');
    this.updateOutput();
  }

  deleteChar() {
    this.inputText.update(val => val.slice(0, -1));
    this.updateOutput();
  }

  toggleDirection() {
    this.isLatinToGurung.update(val => !val);
    const currInput = this.inputText();
    const currOutput = this.outputText();
    this.inputText.set(currOutput);
    this.outputText.set(currInput);
  }

  private updateOutput() {
    if (this.isLatinToGurung()) {
      this.outputText.set(this.translitService.transliterate(this.inputText()));
    } else {
      this.outputText.set(this.translitService.reverseTransliterate(this.inputText()));
    }
  }
}