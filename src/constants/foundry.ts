import { getAddress } from "@ethersproject/address";
import { Price, Token } from "@uniswap/sdk-core";

import { WrappedTokenInfo } from "../hooks/useTokens2";
import { Stable, WrappedNative } from "./tokens";
import type { Lendgine } from "./types";

export const wethLendgine = {
  token0: Stable[31337],
  token1: WrappedNative[31337],
  lendgine: new Token(31337, "0x66F62E3d661e82B4191B9ED8F5795ac57a65C246", 18),
  bound: new Price(
    Stable[31337],
    WrappedNative[31337],
    "1000000000000000000",
    "3000000000000000000000"
  ),
  token0Exp: Stable[31337].decimals,
  token1Exp: WrappedNative[31337].decimals,

  address: "0x66F62E3d661e82B4191B9ED8F5795ac57a65C246",
} as const satisfies Lendgine;

const Illuvium = new WrappedTokenInfo({
  chainId: 31337,
  address: "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E",
  decimals: 18,
  symbol: "ILV",
  name: "Illuvium",
});

export const illuviumLendgine = {
  token0: WrappedNative[31337],
  token1: Illuvium,
  lendgine: new Token(31337, "0x35988a69DdF99f522c7AA6E0ad80D52813BF2069", 18),
  bound: new Price(
    WrappedNative[31337],
    Illuvium,
    "1000000000000000000",
    "150000000000000000"
  ),

  token0Exp: WrappedNative[31337].decimals,
  token1Exp: Illuvium.decimals,

  address: "0x35988a69DdF99f522c7AA6E0ad80D52813BF2069",
} as const satisfies Lendgine;

export const inverseIlluviumLendgine = {
  token0: Illuvium,
  token1: WrappedNative[31337],
  lendgine: new Token(31337, "0xEf921A20A2eA86Dea5C3a572633f867d3c01AA33", 18),
  bound: new Price(
    Illuvium,
    WrappedNative[31337],
    "1000000000000000000",
    "60000000000000000000"
  ),

  token0Exp: Illuvium.decimals,
  token1Exp: WrappedNative[31337].decimals,

  address: "0xEf921A20A2eA86Dea5C3a572633f867d3c01AA33",
} as const satisfies Lendgine;

export const foundryConfig = {
  base: {
    factory: getAddress("0x09c1133669cb9b49704dc27ae0b523be74467f2a"),
    liquidityManager: getAddress("0x0d0932b07aca7ea902d2432e70e054de8b12a834"),
    lendgineRouter: getAddress("0xb9afd5588d683aabd56538b555d2e17c7559b0b8"),
  },
  interface: {
    uniswapV2subgraph:
      "https://api.thegraph.com/subgraphs/name/sushiswap/exchange",
    uniswapV3subgraph:
      "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
    wrappedNative: WrappedNative[31337],
    stablecoin: Stable[31337],
    defaultActiveLists: [
      "https://tokens.uniswap.org", // TODO: this is not returning very fast
      // "https://celo-org.github.io/celo-token-list/celo.tokenlist.json",
    ],
    defaultInactiveLists: [],
  },
  lendgines: [wethLendgine, illuviumLendgine, inverseIlluviumLendgine] as const,
} as const;

// uniswapV2subgraph:
// "https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap",
// uniswapV3subgraph:
// "https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo",
