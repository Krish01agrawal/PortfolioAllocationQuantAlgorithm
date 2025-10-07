/**
 * Fund Status Enum
 * 
 * Purpose: Track fund lifecycle status
 */
export enum FundStatus {
  ACTIVE = 'Active',
  CLOSED = 'Closed',
  MERGED = 'Merged',
  SUSPENDED = 'Suspended',
}

export const FUND_STATUSES = Object.values(FundStatus);

