import { Money } from '../value-objects/money.vo';
import { ImportHash } from '../value-objects/import-hash.vo';

export interface ParsedLine {
  date: Date;
  description: string;
  amount: Money;
  hash: ImportHash;
}

export interface ParseError {
  lineNumber: number;
  rawLine: string;
  reason: string;
}

export interface ParseResult {
  parsed: ParsedLine[];
  errors: ParseError[];
}

const DEFAULT_CURRENCY = 'USD';

export class TextImportParserService {
  parse(rawText: string, groupId: string, year: number): ParseResult {
    const parsed: ParsedLine[] = [];
    const errors: ParseError[] = [];
    const lines = rawText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Silently skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;

      const parts = trimmed.split(' | ');

      if (parts.length < 3) {
        errors.push({
          lineNumber: i + 1,
          rawLine,
          reason: `Expected format "DD/MM | description | amount", got ${parts.length} part(s)`,
        });
        continue;
      }

      const [dateStr, description, amountStr] = parts;

      // Parse date: DD/MM
      const dateParts = dateStr.trim().split('/');
      if (dateParts.length !== 2) {
        errors.push({ lineNumber: i + 1, rawLine, reason: `Invalid date format: "${dateStr.trim()}" — expected DD/MM` });
        continue;
      }

      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);

      if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
        errors.push({ lineNumber: i + 1, rawLine, reason: `Invalid date values: day=${day}, month=${month}` });
        continue;
      }

      const date = new Date(year, month - 1, day);

      // Parse amount — comma is accepted as decimal separator
      const normalizedAmount = amountStr.trim().replace(',', '.');
      const amountValue = parseFloat(normalizedAmount);

      if (isNaN(amountValue)) {
        errors.push({ lineNumber: i + 1, rawLine, reason: `Invalid amount: "${amountStr.trim()}"` });
        continue;
      }

      let money: Money;
      try {
        money = Money.create(amountValue, DEFAULT_CURRENCY);
      } catch (e) {
        errors.push({
          lineNumber: i + 1,
          rawLine,
          reason: e instanceof Error ? e.message : 'Invalid amount value',
        });
        continue;
      }

      const hash = ImportHash.fromRaw(
        dateStr.trim(),
        description.trim(),
        normalizedAmount,
        groupId,
      );

      parsed.push({ date, description: description.trim(), amount: money, hash });
    }

    return { parsed, errors };
  }
}
