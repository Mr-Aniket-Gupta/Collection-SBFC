/** Row shape returned by the generic DCSP query endpoints. */
export interface DcspTableRow {
  [key: string]: string | number | boolean | null
}

/** Paginated response wrapper from the Reports API. */
export interface DcspPagedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
