import type { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { useMemo } from "react";

import { borrowRate } from "../../../../../lib/jumprate";
import { accruedLendgineInfo, getT } from "../../../../../lib/lendgineMath";
import { numoenPrice } from "../../../../../lib/price";
import type { Lendgine, LendgineInfo } from "../../../../../lib/types/lendgine";
import { formatPercent } from "../../../../../utils/format";
import { Button } from "../../../../common/Button";
import { TokenAmountDisplay } from "../../../../common/TokenAmountDisplay";
import { useTradeDetails } from "../../TradeDetailsInner";
import { usePositionValue } from "../../usePositionValue";

type Props<L extends Lendgine = Lendgine> = {
  balance: CurrencyAmount<Token>;
  lendgine: L;
  lendgineInfo: LendgineInfo<L>;
};

export const PositionItem: React.FC<Props> = ({
  lendgine,
  lendgineInfo,
}: Props) => {
  const { base, quote, setSelectedLendgine, setClose } = useTradeDetails();
  const symbol = quote.symbol + (lendgine.token1.equals(quote) ? "+" : "-");
  const isInverse = base.equals(lendgine.token1);

  const positionValue = usePositionValue(lendgine);
  const t = getT();

  const funding = useMemo(() => {
    const updatedLendgineInfo = accruedLendgineInfo(lendgine, lendgineInfo, t);
    return borrowRate(updatedLendgineInfo);
  }, [lendgine, lendgineInfo, t]);

  const value = useMemo(() => {
    if (!positionValue) return undefined;
    // token0 / token1
    const price = numoenPrice(lendgine, lendgineInfo);

    return isInverse ? positionValue : price.quote(positionValue);
  }, [isInverse, lendgine, lendgineInfo, positionValue]);

  return (
    <div tw="w-full justify-between grid grid-cols-3 sm:grid-cols-6 items-center h-12">
      <p tw="font-semibold col-span-1">{symbol}</p>

      {value ? (
        <TokenAmountDisplay
          amount={value}
          showSymbol
          tw="sm:col-span-2 justify-self-start"
        />
      ) : (
        <div tw="w-14 sm:w-20 h-6 rounded-lg sm:col-span-2 justify-self-start bg-gray-100 " />
      )}
      <p tw="justify-self-start  hidden sm:(col-span-2 grid)">
        {formatPercent(funding)}
      </p>

      <Button
        variant="danger"
        tw=" text-lg font-semibold"
        onClick={() => {
          setClose(true);
          setSelectedLendgine(lendgine);
        }}
      >
        Close
      </Button>
    </div>
  );
};
