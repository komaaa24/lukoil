export const timestampType = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz';
export const enumColumnType = process.env.NODE_ENV === 'test' ? 'simple-enum' : 'enum';
