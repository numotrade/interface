import { Percent } from "@uniswap/sdk-core";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import invariant from "tiny-invariant";

import {
  useMostLiquidMarket,
  usePriceHistory,
} from "../../../hooks/useExternalExchange";
import type { WrappedTokenInfo } from "../../../hooks/useTokens2";
import { TokenIcon } from "../../common/TokenIcon";
import { Times } from "../TradeDetails/Chart/TimeSelector";
import { MiniChart } from "./MiniChart";

interface Props {
  tokens: readonly [WrappedTokenInfo, WrappedTokenInfo];
}

export const MarketItem: React.FC<Props> = ({ tokens }: Props) => {
  const referenceMarketQuery = useMostLiquidMarket(tokens);

  const invertPriceQuery = tokens[1].sortsBefore(tokens[0]);

  const priceHistoryQuery = usePriceHistory(
    referenceMarketQuery.data?.pool,
    Times.ONE_DAY
  );

  const priceHistory = useMemo(() => {
    if (!priceHistoryQuery.data) return null;
    return invertPriceQuery
      ? priceHistoryQuery.data.map((p) => ({
          ...p,
          price: p.price.invert(),
        }))
      : priceHistoryQuery.data;
  }, [invertPriceQuery, priceHistoryQuery.data]);

  const currentPrice = useMemo(() => {
    if (!referenceMarketQuery.data) return null;
    return invertPriceQuery
      ? referenceMarketQuery.data.price.invert()
      : referenceMarketQuery.data.price;
  }, [invertPriceQuery, referenceMarketQuery.data]);

  const priceChange = useMemo(() => {
    if (!currentPrice || !priceHistory) return null;

    const oneDayOldPrice = priceHistory[priceHistory.length - 1]?.price;
    invariant(oneDayOldPrice, "no prices returned");

    const f = currentPrice.subtract(oneDayOldPrice).divide(oneDayOldPrice);

    return new Percent(f.numerator, f.denominator);
  }, [currentPrice, priceHistory]);

  return (
    <NavLink
      tw=""
      to={`/trade/details/${tokens[0].address}/${tokens[1].address}`}
    >
      <div tw="w-full rounded-xl hover:scale-110 transform ease-in-out duration-300 grid grid-cols-5 px-6 h-14 items-center justify-between ">
        <div tw="flex items-center gap-3 col-span-2">
          <div tw="flex items-center space-x-[-0.5rem] rounded-lg bg-gray-200 px-2 py-1">
            <TokenIcon token={tokens[1]} size={32} />
            <TokenIcon token={tokens[0]} size={32} />
          </div>
          <div tw="grid gap-0.5">
            <span tw="font-semibold text-lg text-default leading-tight">
              {tokens[1].symbol} / {tokens[0].symbol}
            </span>
          </div>
        </div>

        {!!priceHistory && !!currentPrice ? (
          <MiniChart priceHistory={priceHistory} currentPrice={currentPrice} />
        ) : (
          <div tw="rounded-lg h-10 w-32 animate-pulse transform ease-in-out duration-300 bg-gray-200 justify-self-center col-span-2" />
        )}

        {priceChange ? (
          <div tw="text-lg font-semibold justify-self-end">
            {priceChange.greaterThan(0) ? (
              <p tw="text-green-500 ">+{priceChange.toFixed(2)}%</p>
            ) : (
              <p tw="text-red">{priceChange.toFixed(2)}%</p>
            )}
          </div>
        ) : (
          <div tw=" justify-self-end h-6 rounded-lg bg-gray-200 w-16 transform animate-pulse ease-in-out duration-300" />
        )}
      </div>
    </NavLink>
  );
};
