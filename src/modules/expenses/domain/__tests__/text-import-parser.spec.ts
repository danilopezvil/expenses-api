import { TextImportParserService } from '../services/text-import-parser.service';

const GROUP_ID = 'group-abc';
const YEAR = 2024;

describe('TextImportParserService', () => {
  let parser: TextImportParserService;

  beforeEach(() => {
    parser = new TextImportParserService();
  });

  it('parses a single valid line', () => {
    const { parsed, errors } = parser.parse('15/03 | Supermarket | 85.50', GROUP_ID, YEAR);
    expect(errors).toHaveLength(0);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].description).toBe('Supermarket');
    expect(parsed[0].amount.amount).toBe(85.50);
    expect(parsed[0].date).toEqual(new Date(2024, 2, 15)); // month is 0-indexed
  });

  it('handles comma as decimal separator', () => {
    const { parsed, errors } = parser.parse('10/06 | Coffee | 4,50', GROUP_ID, YEAR);
    expect(errors).toHaveLength(0);
    expect(parsed[0].amount.amount).toBe(4.50);
  });

  it('parses multiple valid lines', () => {
    const raw = [
      '01/01 | Gas | 60.00',
      '02/01 | Groceries | 120.30',
      '03/01 | Restaurant | 45.80',
    ].join('\n');
    const { parsed, errors } = parser.parse(raw, GROUP_ID, YEAR);
    expect(errors).toHaveLength(0);
    expect(parsed).toHaveLength(3);
  });

  it('silently ignores empty lines', () => {
    const raw = '\n15/03 | Taxi | 12.00\n\n\n20/03 | Bus | 2.50\n';
    const { parsed, errors } = parser.parse(raw, GROUP_ID, YEAR);
    expect(errors).toHaveLength(0);
    expect(parsed).toHaveLength(2);
  });

  it('silently ignores lines starting with #', () => {
    const raw = '# This is a comment\n15/03 | Market | 30.00\n# Another comment';
    const { parsed, errors } = parser.parse(raw, GROUP_ID, YEAR);
    expect(errors).toHaveLength(0);
    expect(parsed).toHaveLength(1);
  });

  it('reports error for wrong number of pipe-separated parts', () => {
    const { parsed, errors } = parser.parse('15/03 | OnlyTwoParts', GROUP_ID, YEAR);
    expect(parsed).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].lineNumber).toBe(1);
  });

  it('reports error for invalid date format', () => {
    const { parsed, errors } = parser.parse('2024-03-15 | Item | 10.00', GROUP_ID, YEAR);
    expect(parsed).toHaveLength(0);
    expect(errors[0].reason).toContain('date');
  });

  it('reports error for invalid date values (month 13)', () => {
    const { parsed, errors } = parser.parse('01/13 | Item | 10.00', GROUP_ID, YEAR);
    expect(parsed).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('reports error for non-numeric amount', () => {
    const { parsed, errors } = parser.parse('15/03 | Item | abc', GROUP_ID, YEAR);
    expect(parsed).toHaveLength(0);
    expect(errors[0].reason).toContain('amount');
  });

  it('collects errors and valid lines in the same run', () => {
    const raw = [
      '01/01 | Valid | 50.00',
      'bad-line',
      '02/01 | Also valid | 30.00',
    ].join('\n');
    const { parsed, errors } = parser.parse(raw, GROUP_ID, YEAR);
    expect(parsed).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0].lineNumber).toBe(2);
  });

  it('same raw content produces the same hash (deterministic)', () => {
    const line = '15/03 | Rent | 500.00';
    const r1 = parser.parse(line, GROUP_ID, YEAR);
    const r2 = parser.parse(line, GROUP_ID, YEAR);
    expect(r1.parsed[0].hash.value).toBe(r2.parsed[0].hash.value);
  });

  it('different content produces different hashes', () => {
    const r1 = parser.parse('15/03 | Rent | 500.00', GROUP_ID, YEAR);
    const r2 = parser.parse('15/03 | Food | 500.00', GROUP_ID, YEAR);
    expect(r1.parsed[0].hash.value).not.toBe(r2.parsed[0].hash.value);
  });

  it('returns empty results for an empty string', () => {
    const { parsed, errors } = parser.parse('', GROUP_ID, YEAR);
    expect(parsed).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});
