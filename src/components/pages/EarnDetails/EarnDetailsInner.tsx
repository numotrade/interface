import { useState } from "react";
import invariant from "tiny-invariant";
import { createContainer } from "unstated-next";

import type { Lendgine } from "../../../constants/types";
import type { WrappedTokenInfo } from "../../../hooks/useTokens2";
import {
  pickLongLendgines,
  pickShortLendgines,
} from "../../../utils/lendgines";
import { BoundSelection } from "./BoundSelection";
import { History } from "./History/History";
import { Positions } from "./History/Positions/Positions";
import { Lendgines } from "./Lendgines";
import { Market } from "./Market";
import { TradeColumn } from "./TradeColumn/TradeColumn";

interface Props {
  base: WrappedTokenInfo;
  quote: WrappedTokenInfo;
  lendgines: readonly Lendgine[];
}

interface IEarnDetails {
  base: WrappedTokenInfo;
  quote: WrappedTokenInfo;

  selectedLendgine: Lendgine;
  setSelectedLendgine: (val: Lendgine) => void;

  close: boolean;
  setClose: (val: boolean) => void;

  lendgines: readonly Lendgine[];
}

const useEarnDetailsInternal = ({
  base,
  quote,
  lendgines,
}: Partial<Props> = {}): IEarnDetails => {
  invariant(base && quote && lendgines);
  const [close, setClose] = useState(false);

  const longLendgine = pickLongLendgines(lendgines, base);
  const shortLendgine = pickShortLendgines(lendgines, base);

  const lendgine = longLendgine[0] ? longLendgine[0] : shortLendgine[0];
  invariant(lendgine);

  const [selectedLendgine, setSelectedLendgine] = useState<Lendgine>(lendgine);

  return {
    base,
    quote,
    lendgines,
    selectedLendgine,
    setSelectedLendgine,
    close,
    setClose,
  };
};

export const { Provider: EarnDetailsProvider, useContainer: useEarnDetails } =
  createContainer(useEarnDetailsInternal);

export const EarnDetailsInner: React.FC<Props> = ({
  base,
  quote,
  lendgines,
}: Props) => {
  return (
    <div tw="w-full grid grid-cols-3">
      <EarnDetailsProvider initialState={{ base, quote, lendgines }}>
        <div tw="w-full flex flex-col max-w-3xl gap-4 col-span-2">
          <Market />
          <p tw="text-sm font-semibold">Select a pool</p>
          <Lendgines />
          <BoundSelection />
          <div tw="border-b-2 border-gray-200" />

          <History />
          <Positions />
        </div>
        <div tw="flex max-w-sm justify-self-end">
          {/* TODO: stick to the right side */}
          <div tw="border-l-2 border-gray-200 sticky h-[75vh] min-h-[50rem] mt-[-1rem]" />
          <TradeColumn tw="" />
        </div>
      </EarnDetailsProvider>
    </div>
  );
};
