export interface ImportRecord {
  id: string;
  groupId: string;
  year: number;
  count: number;
  totalAmount: number;
  currency: string;
  importedAt: Date;
}

export interface IImportsRepository {
  save(record: Omit<ImportRecord, 'id' | 'importedAt'>): Promise<ImportRecord>;
}
