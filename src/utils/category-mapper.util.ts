import { FundCategory } from '../enums/fund-category.enum';

/**
 * Category Mapper Utility
 * 
 * Purpose: Normalize various Morningstar category names to our standard enum
 * Handles variations and aliases in category naming
 */

type CategoryMapping = {
  [key: string]: string;
};

/**
 * Mapping of Morningstar category variations to our standard categories
 */
const CATEGORY_ALIASES: CategoryMapping = {
  // Large Cap variations
  'Large Cap Equity': FundCategory.LARGE_CAP,
  'Large Cap': FundCategory.LARGE_CAP,
  'Large-Cap': FundCategory.LARGE_CAP,
  'LargeCap': FundCategory.LARGE_CAP,
  'Equity: Large Cap': FundCategory.LARGE_CAP,

  // Mid Cap variations
  'Mid Cap Equity': FundCategory.MID_CAP,
  'Mid Cap': FundCategory.MID_CAP,
  'Mid-Cap': FundCategory.MID_CAP,
  'MidCap': FundCategory.MID_CAP,
  'Equity: Mid Cap': FundCategory.MID_CAP,

  // Small Cap variations
  'Small Cap Equity': FundCategory.SMALL_CAP,
  'Small Cap': FundCategory.SMALL_CAP,
  'Small-Cap': FundCategory.SMALL_CAP,
  'SmallCap': FundCategory.SMALL_CAP,
  'Equity: Small Cap': FundCategory.SMALL_CAP,

  // Flexi Cap variations
  'Flexi-Cap / MultiCap': FundCategory.FLEXI_CAP,
  'Flexi Cap Equity': FundCategory.FLEXI_CAP,
  'Flexi Cap': FundCategory.FLEXI_CAP,
  'FlexiCap': FundCategory.FLEXI_CAP,
  'Flexi-Cap': FundCategory.FLEXI_CAP,
  'Multi Cap': FundCategory.FLEXI_CAP,
  'MultiCap': FundCategory.FLEXI_CAP,
  'Multi-Cap': FundCategory.FLEXI_CAP,
  'Equity: Flexi Cap': FundCategory.FLEXI_CAP,

  // Index / ETF variations
  'Index / ETF': FundCategory.INDEX_ETF,
  'Index Fund': FundCategory.INDEX_ETF,
  'ETF': FundCategory.INDEX_ETF,
  'Index': FundCategory.INDEX_ETF,
  'Equity: Index': FundCategory.INDEX_ETF,

  // International variations
  'International Equity': FundCategory.INTERNATIONAL,
  'International': FundCategory.INTERNATIONAL,
  'Global': FundCategory.INTERNATIONAL,
  'Foreign': FundCategory.INTERNATIONAL,
  'Equity: International': FundCategory.INTERNATIONAL,

  // Hybrid Conservative variations
  'Hybrid – Conservative': FundCategory.HYBRID_CONSERVATIVE,
  'Hybrid - Conservative': FundCategory.HYBRID_CONSERVATIVE,
  'Conservative Hybrid': FundCategory.HYBRID_CONSERVATIVE,
  'Hybrid: Conservative': FundCategory.HYBRID_CONSERVATIVE,

  // Hybrid Equity-Oriented variations
  'Hybrid – Equity-Oriented': FundCategory.HYBRID_EQUITY,
  'Hybrid - Equity-Oriented': FundCategory.HYBRID_EQUITY,
  'Hybrid Equity Oriented': FundCategory.HYBRID_EQUITY,
  'Aggressive Hybrid': FundCategory.HYBRID_EQUITY,
  'Hybrid: Equity': FundCategory.HYBRID_EQUITY,

  // Debt Corporate variations
  'Debt – Corporate': FundCategory.DEBT_CORPORATE,
  'Debt - Corporate': FundCategory.DEBT_CORPORATE,
  'Corporate Bond': FundCategory.DEBT_CORPORATE,
  'Corporate Debt': FundCategory.DEBT_CORPORATE,
  'Debt: Corporate': FundCategory.DEBT_CORPORATE,

  // Debt Short/Ultra Short variations
  'Debt – Short/Ultra Short': FundCategory.DEBT_SHORT,
  'Debt - Short/Ultra Short': FundCategory.DEBT_SHORT,
  'Short Duration': FundCategory.DEBT_SHORT,
  'Ultra Short Duration': FundCategory.DEBT_SHORT,
  'Liquid': FundCategory.DEBT_SHORT,
  'Money Market': FundCategory.DEBT_SHORT,
  'Debt: Short': FundCategory.DEBT_SHORT,

  // Debt Banking/PSU variations
  'Debt – Banking / PSU': FundCategory.DEBT_BANKING_PSU,
  'Debt - Banking / PSU': FundCategory.DEBT_BANKING_PSU,
  'Banking & PSU': FundCategory.DEBT_BANKING_PSU,
  'Banking and PSU': FundCategory.DEBT_BANKING_PSU,
  'PSU': FundCategory.DEBT_BANKING_PSU,
  'Debt: Banking': FundCategory.DEBT_BANKING_PSU,

  // Debt Gilt variations
  'Debt – Gilt': FundCategory.DEBT_GILT,
  'Debt - Gilt': FundCategory.DEBT_GILT,
  'Gilt': FundCategory.DEBT_GILT,
  'Government Securities': FundCategory.DEBT_GILT,
  'G-Sec': FundCategory.DEBT_GILT,
  'Debt: Gilt': FundCategory.DEBT_GILT,
};

/**
 * Normalize category name to standard format
 * 
 * @param rawCategory - Category name from Morningstar
 * @returns Normalized category name or original if no mapping found
 */
export function normalizeFundCategory(rawCategory: string): string {
  if (!rawCategory) {
    return rawCategory;
  }

  // Try exact match first
  const trimmed = rawCategory.trim();
  if (CATEGORY_ALIASES[trimmed]) {
    return CATEGORY_ALIASES[trimmed];
  }

  // Try case-insensitive match
  const lowerCategory = trimmed.toLowerCase();
  for (const [alias, standard] of Object.entries(CATEGORY_ALIASES)) {
    if (alias.toLowerCase() === lowerCategory) {
      return standard;
    }
  }

  // Return original if no match (validation will catch it later)
  return trimmed;
}

/**
 * Check if a category is valid after normalization
 */
export function isValidCategory(rawCategory: string): boolean {
  const normalized = normalizeFundCategory(rawCategory);
  return Object.values(FundCategory).includes(normalized as FundCategory);
}

