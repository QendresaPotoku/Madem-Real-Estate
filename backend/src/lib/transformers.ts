import { ValueTransformer } from 'typeorm';

/** Postgres `numeric`/`decimal` come back as strings; convert to JS number. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};
