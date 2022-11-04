import type { TokenAmount } from "@dahlia-labs/token-utils";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import invariant from "tiny-invariant";
import { createContainer } from "unstated-next";

import type { IMarket } from "../../../../contexts/environment";
import { useAddressToMarket } from "../../../../contexts/environment";
import { useSettings } from "../../../../contexts/settings";
import { usePair } from "../../../../hooks/usePair";
import { Page } from "../../../common/Page";
import { pairInfoToPrice } from "../PositionCard/Stats";
import { Action } from "./Action";
import { Button } from "./Button";
import { Invalid } from "./Invalid";
import { Position } from "./Position";
import { Top } from "./Top";
import { useDeposit } from "./useDeposit";

export enum ActionType {
  Deposit = "Deposit",
  Withdraw = "Withdraw",
}

export enum Input {
  Base,
  Speculative,
}

interface IManage {
  market: IMarket;
  tokenID?: number;

  action: ActionType;
  setAction: (val: ActionType) => void;

  withdrawPercent: number;
  setWithdrawPercent: (val: number) => void;

  depositBaseAmount: TokenAmount | null;
  depositSpeculativeAmount: TokenAmount | null;
  setDepositAmount: (input: Input, val: TokenAmount) => void;

  onSend: () => Promise<void> | void;
  disableReason: string | null;
}

const useManageInternal = ({
  market,
  tokenID,
}: {
  market?: IMarket;
  tokenID?: number;
} = {}): IManage => {
  invariant(market, "market provider");

  const pairInfo = usePair(market.pair);

  const [action, setAction] = useState<ActionType>(ActionType.Deposit);

  const [withdrawPercent, setWithdrawPercent] = useState(25);
  const [depositBaseAmount, setDepositBaseAmount] =
    useState<TokenAmount | null>(null);
  const [depositSpeculativeAmount, setDepositSpeculativeAmount] =
    useState<TokenAmount | null>(null);

  const price = useMemo(
    () => (pairInfo ? pairInfoToPrice(pairInfo, market.pair) : null),
    [market.pair, pairInfo]
  );

  const setDepositAmount = useCallback(
    (input: Input, val: TokenAmount) => {
      if (!price) return;
      input === Input.Base
        ? setDepositBaseAmount(val)
        : setDepositSpeculativeAmount(val);

      input === Input.Base
        ? setDepositSpeculativeAmount(
            val.scale(
              market.pair.bound
                .subtract(price)
                .multiply(2)
                .divide(price.asFraction.multiply(price))
            )
          )
        : setDepositBaseAmount(
            val.scale(
              price.asFraction
                .multiply(price)
                .divide(market.pair.bound.subtract(price).multiply(2))
            )
          );
    },
    [market.pair.bound, price]
  );

  const settings = useSettings();
  const { onSend, disableReason } = useDeposit(
    market,
    // null,
    depositBaseAmount,
    depositSpeculativeAmount,
    settings
  );
  return {
    market,
    tokenID,

    action,
    setAction,

    withdrawPercent,
    setWithdrawPercent,

    depositBaseAmount,
    depositSpeculativeAmount,
    setDepositAmount,

    onSend,
    disableReason,
  };
};

export const { Provider: ManageProvider, useContainer: useManage } =
  createContainer(useManageInternal);

export const Manage: React.FC = () => {
  const { lendgineAddress, tokenID } = useParams<{
    lendgineAddress: string;
    tokenID: string;
  }>();
  invariant(lendgineAddress, "pool address missing");

  const market = useAddressToMarket(lendgineAddress);

  return (
    <Page>
      {!market ? (
        <Invalid />
      ) : (
        <ManageProvider
          initialState={{ market, tokenID: tokenID ? +tokenID : undefined }}
        >
          <Top />
          {!!tokenID && <Position />}
          <Action />
          <Button />
        </ManageProvider>
      )}
    </Page>
  );
};
