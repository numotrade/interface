import { CurrencyAmount } from "@uniswap/sdk-core";
import { utils } from "ethers";
import JSBI from "jsbi";

import type { WrappedTokenInfo } from "../lib/types/wrappedTokenInfo";

/**
 * Parses a CurrencyAmount from the passed string.
 * Returns the CurrencyAmount, or undefined if parsing fails.
 */
export default function tryParseCurrencyAmount<T extends WrappedTokenInfo>(
  value?: string,
  currency?: T
): CurrencyAmount<T> | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = utils
      .parseUnits(value, currency.decimals)
      .toString();
    if (typedValueParsed !== "0") {
      return CurrencyAmount.fromRawAmount(
        currency,
        JSBI.BigInt(typedValueParsed)
      );
    }
  } catch (error) {
    // fails if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  return undefined;
}
