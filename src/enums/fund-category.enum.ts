/**
 * Fund Category Enum
 * 
 * Purpose: Define all 12 asset categories
 * Used across: Schemas, DTOs, Validation, Scoring
 */
export enum FundCategory {
  LARGE_CAP = 'Large Cap Equity',
  MID_CAP = 'Mid Cap Equity',
  SMALL_CAP = 'Small Cap Equity',
  FLEXI_CAP = 'Flexi-Cap / MultiCap',
  INDEX_ETF = 'Index / ETF',
  INTERNATIONAL = 'International Equity',
  HYBRID_CONSERVATIVE = 'Hybrid – Conservative',
  HYBRID_EQUITY = 'Hybrid – Equity-Oriented',
  DEBT_CORPORATE = 'Debt – Corporate',
  DEBT_SHORT = 'Debt – Short/Ultra Short',
  DEBT_BANKING_PSU = 'Debt – Banking / PSU',
  DEBT_GILT = 'Debt – Gilt',
}

export const FUND_CATEGORIES = Object.values(FundCategory);

