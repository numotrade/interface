import { Percent } from "@uniswap/sdk-core";

import type { Lendgine, LendgineInfo } from "./types/lendgine";

const rateConstants = {
  pmmp: {
    kink: new Percent(8, 10),
    multiplier: new Percent(1375, 1000),
    jumpMultiplier: new Percent(89, 2),
  },
  stpmmp: {
    kink: new Percent(8, 10),
    multiplier: new Percent(375, 10_000),
    jumpMultiplier: new Percent(45, 100),
  },
} as const;

type RateConfig = {
  lendgineInfo: Pick<
    LendgineInfo<Lendgine>,
    "totalLiquidity" | "totalLiquidityBorrowed"
  >;
  rateModel: keyof typeof rateConstants;
};

const utilizationRate = ({
  lendgineInfo,
}: Pick<RateConfig, "lendgineInfo">): Percent => {
  const totalLiquiditySupplied = lendgineInfo.totalLiquidity.add(
    lendgineInfo.totalLiquidityBorrowed
  );
  if (totalLiquiditySupplied.equalTo(0)) return new Percent(0);
  const f = lendgineInfo.totalLiquidityBorrowed.divide(totalLiquiditySupplied);
  return new Percent(f.numerator, f.denominator);
};

export const calculateBorrowRate = ({
  lendgineInfo,
  rateModel,
}: RateConfig): Percent => {
  const utilization = utilizationRate({ lendgineInfo });
  const rateParams = rateConstants[rateModel];

  if (utilization.greaterThan(rateParams.kink)) {
    const normalRate = rateParams.kink.multiply(rateParams.multiplier);
    const excessUtil = utilization.subtract(rateParams.kink);
    return excessUtil.multiply(rateParams.jumpMultiplier).add(normalRate);
  } else {
    return utilization.multiply(rateParams.multiplier);
  }
};

export const calculateSupplyRate = ({
  lendgineInfo,
  rateModel,
}: RateConfig): Percent => {
  const utilization = utilizationRate({ lendgineInfo });

  const borrow = calculateBorrowRate({ lendgineInfo, rateModel });
  return utilization.multiply(borrow);
};
