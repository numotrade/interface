import type { Price } from "@uniswap/sdk-core";
import { useState } from "react";
import invariant from "tiny-invariant";
import { createContainer } from "unstated-next";

import { Chart } from "./Chart/Chart";
import { History } from "./History/History";
import { Markets } from "./Markets";
import { Returns } from "./Returns";
import type { Times } from "./TimeSelector";
import { TimeSelector } from "./TimeSelector";
import { TotalStats } from "./TotalStats";
import type { TradeTab } from "./TradeColumn/TradeColumn";
import { TradeColumn } from "./TradeColumn/TradeColumn";
import { pickLongLendgines, pickShortLendgines } from "../../../lib/lendgines";
import { nextHighestLendgine, nextLowestLendgine } from "../../../lib/price";
import type { Lendgine } from "../../../lib/types/lendgine";
import type { WrappedTokenInfo } from "../../../lib/types/wrappedTokenInfo";

interface Props {
  base: WrappedTokenInfo;
  quote: WrappedTokenInfo;
  lendgines: readonly Lendgine[];
  price: Price<WrappedTokenInfo, WrappedTokenInfo>;
}

interface ITradeDetails {
  base: WrappedTokenInfo;
  quote: WrappedTokenInfo;

  timeframe: keyof typeof Times;
  setTimeframe: (val: keyof typeof Times) => void;

  trade: keyof typeof TradeTab;
  setTrade: (val: keyof typeof TradeTab) => void;

  selectedLendgine: Lendgine;
  setSelectedLendgine: (val: Lendgine) => void;

  close: boolean;
  setClose: (val: boolean) => void;

  lendgines: readonly Lendgine[];
  price: Price<WrappedTokenInfo, WrappedTokenInfo>;
}

const useTradeDetailsInternal = ({
  base,
  quote,
  lendgines,
  price,
}: Partial<Props> = {}): ITradeDetails => {
  invariant(base && quote && lendgines && price);
  const [timeframe, setTimeframe] = useState<keyof typeof Times>("ONE_WEEK");
  const [trade, setTrade] = useState<keyof typeof TradeTab>("Long");
  const [close, setClose] = useState(false);

  const longLendgines = pickLongLendgines(lendgines, base);
  const shortLendgines = pickShortLendgines(lendgines, base);
  const nextLongLendgine = nextHighestLendgine({
    price,
    lendgines: longLendgines,
  });
  const nextShortLendgine = nextHighestLendgine({
    price: price.invert(),
    lendgines: shortLendgines,
  });
  const secondLongLendgine = nextLowestLendgine({
    price,
    lendgines: longLendgines,
  });
  const secondShortLendgine = nextLowestLendgine({
    price: price.invert(),
    lendgines: shortLendgines,
  });

  const lendgine =
    nextLongLendgine ??
    secondLongLendgine ??
    nextShortLendgine ??
    secondShortLendgine;
  invariant(lendgine);

  const [selectedLendgine, setSelectedLendgine] = useState<Lendgine>(lendgine);

  return {
    base,
    quote,

    timeframe,
    setTimeframe,

    selectedLendgine,
    setSelectedLendgine,

    trade,
    setTrade,

    close,
    setClose,

    lendgines,
    price,
  };
};

export const { Provider: TradeDetailsProvider, useContainer: useTradeDetails } =
  createContainer(useTradeDetailsInternal);

export const TradeDetailsInner: React.FC<Props> = ({
  base,
  quote,
  lendgines,
  price,
}: Props) => {
  return (
    <TradeDetailsProvider initialState={{ base, quote, lendgines, price }}>
      <TradeDetailsInnerInner />
    </TradeDetailsProvider>
  );
};

const TradeDetailsInnerInner: React.FC = () => {
  return (
    <>
      <div tw="w-full max-w-7xl grid lg:(grid-cols-3) gap-2">
        <div tw="lg:col-span-2 w-full flex flex-col gap-2 bg-white border rounded-xl border-[#dfdfdf] p-6 shadow">
          <Markets />
          <Chart />
          <TimeSelector />
        </div>

        <TradeColumn tw="w-full" />
      </div>
      <div tw="w-full max-w-7xl grid lg:( grid-cols-2) gap-2">
        <History />
        <Returns />
        <TotalStats />
      </div>
    </>
  );
};
