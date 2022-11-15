import type { Fraction, TokenAmount } from "@dahlia-labs/token-utils";
import { Percent, Price } from "@dahlia-labs/token-utils";
import { useMemo } from "react";

import type {
  IMarket,
  IMarketInfo,
  IMarketUserInfo,
  IPair,
  IPairInfo,
} from "../../../../contexts/environment";
import { useLendgine } from "../../../../hooks/useLendgine";
import { usePair } from "../../../../hooks/usePair";
import { RowBetween } from "../../../common/RowBetween";

interface Props {
  market: IMarket;
  userInfo: IMarketUserInfo | null;
}

export const pairInfoToPrice = (pairInfo: IPairInfo, pair: IPair): Price => {
  if (pairInfo.totalLPSupply.equalTo(0))
    return new Price(pair.speculativeToken, pair.baseToken, 1, 0);

  const scale1 = pairInfo.speculativeAmount.divide(pairInfo.totalLPSupply);
  const priceFraction = pair.bound.subtract(scale1.divide(2));
  return new Price(
    pair.speculativeToken,
    pair.baseToken,
    priceFraction.denominator,
    priceFraction.numerator
  );
};

export const priceToPairReserves = (
  price: Price,
  liquidity: TokenAmount,
  market: IMarket
): [Fraction, Fraction] => {
  const scale0 = price.asFraction.multiply(price);
  const scale1 = market.pair.bound.subtract(price).multiply(2);

  return [liquidity.multiply(scale0), liquidity.multiply(scale1)];
};

export const pricePerLP = (pairInfo: IPairInfo, pair: IPair): Price => {
  const price = pairInfoToPrice(pairInfo, pair);
  if (price.equalTo(0)) return new Price(pair.lp, pair.baseToken, 1, 0);
  const scale0 = pairInfo.baseAmount.divide(pairInfo.totalLPSupply);
  const scale1 = pairInfo.speculativeAmount.divide(pairInfo.totalLPSupply);
  const priceFraction = scale0.add(scale1.multiply(price));

  return new Price(
    pair.lp,
    pair.baseToken,
    priceFraction.denominator,
    priceFraction.numerator
  );
};

const totalValue = (
  marketInfo: IMarketInfo,
  pairInfo: IPairInfo,
  market: IMarket
): TokenAmount => {
  const price = pricePerLP(pairInfo, market.pair);
  return price.quote(marketInfo.totalLiquidity);
};

const kink = new Percent(8, 10);
const multiplier = new Percent(1375, 100000);
const jumpMultiplier = new Percent(89, 200);

const borrowRate = (marketInfo: IMarketInfo): Percent => {
  if (marketInfo.totalLiquidity.equalTo(0)) return new Percent(0);
  const utilization = Percent.fromFraction(
    marketInfo.totalLiquidityBorrowed.divide(marketInfo.totalLiquidity)
  );

  if (utilization.greaterThan(kink)) {
    const normalRate = kink.multiply(multiplier);
    const excessUtil = utilization.subtract(kink);
    return excessUtil.multiply(jumpMultiplier).add(normalRate);
  } else {
    return utilization.multiply(multiplier);
  }
};

export const supplyRate = (marketInfo: IMarketInfo): Percent => {
  if (marketInfo.totalLiquidity.equalTo(0)) return new Percent(0);
  const utilization = Percent.fromFraction(
    marketInfo.totalLiquidityBorrowed.divide(marketInfo.totalLiquidity)
  );

  const borrow = borrowRate(marketInfo);
  return utilization.multiply(borrow);
};

export const Stats: React.FC<Props> = ({ market, userInfo }: Props) => {
  const marketInfo = useLendgine(market);
  const pairInfo = usePair(market.pair);
  const price = useMemo(
    () => (pairInfo ? pricePerLP(pairInfo, market.pair) : null),
    [market.pair, pairInfo]
  );

  const tvl = useMemo(
    () =>
      marketInfo && pairInfo ? totalValue(marketInfo, pairInfo, market) : null,
    [market, marketInfo, pairInfo]
  );

  return (
    <div tw="">
      {userInfo && userInfo.liquidity.greaterThan(0) && (
        <>
          <RowBetween tw="">
            <p tw="text-default">Your deposit</p>
            <p tw="text-default font-semibold">
              {/* Use proportion of total */}
              {price
                ? userInfo.liquidity
                    .multiply(price)
                    .toFixed(2, { groupSeparator: "," })
                : "--"}{" "}
              {market.pair.baseToken.symbol}
            </p>
          </RowBetween>
          <hr tw="border-[#AEAEB2] rounded " />
        </>
      )}
      <RowBetween>
        <p tw="text-default">TVL</p>
        <p tw="text-default font-semibold">
          {tvl ? tvl.toFixed(2, { groupSeparator: "," }) : "--"}{" "}
          {market.pair.baseToken.symbol.toString()}
        </p>
      </RowBetween>
    </div>
  );
};
