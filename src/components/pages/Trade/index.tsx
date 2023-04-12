import { useMemo, useState } from "react";
import { createContainer } from "unstated-next";

import { TradeInner } from "./TradeInner";
import { useEnvironment } from "../../../contexts/useEnvironment";
import { useAllLendgines } from "../../../hooks/useAllLendgines";
import { lendgineToMarket } from "../../../lib/lendgineValidity";
import type { Market } from "../../../lib/types/market";
import type { WrappedTokenInfo } from "../../../lib/types/wrappedTokenInfo";
import { dedupe } from "../../../utils/dedupe";

interface ITrade {
  assets: readonly WrappedTokenInfo[];
  setAssets: (val: readonly WrappedTokenInfo[]) => void;

  markets: readonly Market[] | null;
}

const useTradeInternal = (): ITrade => {
  const [assets, setAssets] = useState<readonly WrappedTokenInfo[]>([]);

  const environment = useEnvironment();

  const lendgines = useAllLendgines();

  const markets = useMemo(() => {
    if (lendgines === null) return null;
    const markets = lendgines.map((l) =>
      lendgineToMarket(
        l,
        environment.interface.wrappedNative,
        environment.interface.specialtyMarkets
      )
    );

    const dedupedMarkets = dedupe(
      markets,
      (m) => m.base.address + m.quote.address
    );

    const filteredMarkets =
      assets.length === 0
        ? dedupedMarkets
        : dedupedMarkets.filter(
            (m) =>
              !!assets.find((a) => a.equals(m.base)) ||
              !!assets.find((a) => a.equals(m.quote))
          );

    return filteredMarkets;
  }, [
    assets,
    environment.interface.specialtyMarkets,
    environment.interface.wrappedNative,
    lendgines,
  ]);

  return {
    assets,
    setAssets,

    markets,
  };
};

export const { Provider: TradeProvider, useContainer: useTrade } =
  createContainer(useTradeInternal);

export const Trade: React.FC = () => {
  return (
    <TradeProvider>
      <TradeInner />
    </TradeProvider>
  );
};
