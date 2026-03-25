import { createHash } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';
import { ValidationError } from '../../../../shared/errors/domain.errors';

interface ImportHashProps {
  value: string;
}

export class ImportHash extends ValueObject<ImportHashProps> {
  private constructor(props: ImportHashProps) {
    super(props);
  }

  static create(hash: string): ImportHash {
    if (!/^[0-9a-f]{64}$/.test(hash)) {
      throw new ValidationError('ImportHash must be a 64-character lowercase hex string');
    }
    return new ImportHash({ value: hash });
  }

  static fromRaw(
    date: string,
    description: string,
    amount: string,
    groupId: string,
  ): ImportHash {
    const raw = `${date}|${description}|${amount}|${groupId}`;
    const hash = createHash('sha256').update(raw, 'utf8').digest('hex');
    return new ImportHash({ value: hash });
  }

  get value(): string {
    return this.props.value;
  }
}
