import type { Percent } from "@uniswap/sdk-core";
import { useMemo } from "react";
import invariant from "tiny-invariant";

import {
  isLongLendgine,
  pickLongLendgines,
  pickShortLendgines,
} from "../../../../lib/lendgines";
import { nextHighestLendgine, nextLowestLendgine } from "../../../../lib/price";
import { formatPercent, formatPrice } from "../../../../utils/format";
import { LoadingSpinner } from "../../../common/LoadingSpinner";
import { Plus } from "../../../common/Plus";
import { RowBetween } from "../../../common/RowBetween";
import { useTradeDetails } from "../TradeDetailsInner";

interface Props {
  borrowRate: Percent | null;
}

export const BuyStats: React.FC<Props> = ({ borrowRate }: Props) => {
  const { base, selectedLendgine, lendgines, setSelectedLendgine } =
    useTradeDetails();
  const isInverse = !isLongLendgine(selectedLendgine, base);

  // const lendgineInfo = useLendgine(selectedLendgine);

  const { nextLendgine, lowerLendgine } = useMemo(() => {
    const similarLendgines = isInverse
      ? pickShortLendgines(lendgines, base)
      : pickLongLendgines(lendgines, base);

    const nextLendgine = nextHighestLendgine({
      lendgine: selectedLendgine,
      lendgines: similarLendgines,
    });

    const lowerLendgine = nextLowestLendgine({
      lendgine: selectedLendgine,
      lendgines: similarLendgines,
    });

    return { nextLendgine, lowerLendgine };
  }, [base, isInverse, lendgines, selectedLendgine]);

  return (
    <div tw="flex flex-col w-full">
      <RowBetween tw="p-0">
        <p tw="text-secondary">Bound</p>
        <div tw="flex items-center gap-1">
          {(isInverse ? !!nextLendgine : !!lowerLendgine) && (
            <Plus
              icon="minus"
              onClick={() => {
                const lendgine = isInverse ? nextLendgine : lowerLendgine;
                invariant(lendgine);
                setSelectedLendgine(lendgine);
              }}
            />
          )}
          {(isInverse ? !!lowerLendgine : !!nextLendgine) && (
            <Plus
              icon="plus"
              onClick={() => {
                const lendgine = isInverse ? lowerLendgine : nextLendgine;
                invariant(lendgine);
                setSelectedLendgine(lendgine);
              }}
            />
          )}
          {formatPrice(
            isInverse ? selectedLendgine.bound.invert() : selectedLendgine.bound
          )}
        </div>
      </RowBetween>
      <RowBetween tw="p-0">
        <p tw="text-secondary">Funding APR</p>
        <p>{borrowRate ? formatPercent(borrowRate) : <LoadingSpinner />}</p>
      </RowBetween>
      {/* <RowBetween tw="p-0">
        <p tw="text-secondary">Internal Price</p>
        <p>
          {lendgineInfo.data
            ? isInverse
              ? formatPrice(
                  invert(numoenPrice(selectedLendgine, lendgineInfo.data))
                )
              : formatPrice(numoenPrice(selectedLendgine, lendgineInfo.data))
            : "loading"}
        </p>
      </RowBetween> */}
      <RowBetween tw="p-0">
        <p tw="text-secondary">Leverage</p>
        <p>Squared</p>
      </RowBetween>
      <RowBetween tw="p-0">
        <p tw="text-secondary">Liquidation price</p>
        <p>None</p>
      </RowBetween>
      <RowBetween tw="p-0">
        <p tw="text-secondary">Fees</p>
        <p>0</p>
      </RowBetween>
    </div>
  );
};
