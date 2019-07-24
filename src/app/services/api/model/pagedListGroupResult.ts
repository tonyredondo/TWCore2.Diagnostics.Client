import { GroupResult } from './groupResult';

export interface PagedListGroupResult {
  pageNumber?: number;
  pageSize?: number;
  totalResults?: number;
  totalPages?: number;
  data?: Array<GroupResult>;
}
