import { useCallback, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";

import { useEnvironment } from "../../../../contexts/useEnvironment";
import { useApprove } from "../../../../hooks/useApprove";
import { useBalance } from "../../../../hooks/useBalance";
import { useLendgine } from "../../../../hooks/useLendgine";
import { isLongLendgine } from "../../../../lib/lendgines";
import { useBeet } from "../../../../utils/beet";
import tryParseCurrencyAmount from "../../../../utils/tryParseCurrencyAmount";
import { AssetSelection } from "../../../common/AssetSelection";
import { AsyncButton } from "../../../common/AsyncButton";
import { CenterSwitch } from "../../../common/CenterSwitch";
import { useEarnDetails } from "../EarnDetailsInner";
import { useDeposit, useDepositAmounts } from "./useDeposit";

export const Deposit: React.FC = () => {
  const { address } = useAccount();
  const environment = useEnvironment();
  const Beet = useBeet();
  const { selectedLendgine, base, quote } = useEarnDetails();
  const isLong = isLongLendgine(selectedLendgine, base);
  const baseBalance = useBalance(base, address);
  const quoteBalance = useBalance(quote, address);
  const lendgineInfo = useLendgine(selectedLendgine);

  const [baseInput, setBaseInput] = useState("");
  const [quoteInput, setQuoteInput] = useState("");

  const { token0Input, token1Input } = useDepositAmounts({
    amount:
      tryParseCurrencyAmount(baseInput, base) ??
      tryParseCurrencyAmount(quoteInput, quote),
  });

  const { baseInputAmount, quoteInputAmount } = useMemo(
    () =>
      isLong
        ? { baseInputAmount: token0Input, quoteInputAmount: token1Input }
        : { baseInputAmount: token1Input, quoteInputAmount: token0Input },
    [isLong, token0Input, token1Input]
  );

  const deposit = useDeposit({
    token0Input,
    token1Input,
  });

  const onInput = useCallback(
    (value: string, field: "base" | "quote") => {
      if (lendgineInfo.isLoading) return;
      if (!lendgineInfo.data) {
        field === "base" ? setBaseInput(value) : setQuoteInput(value);
        return;
      }

      field === "base" ? setBaseInput(value) : setQuoteInput(value);
      field === "base" ? setQuoteInput("") : setBaseInput("");
    },
    [lendgineInfo.data, lendgineInfo.isLoading]
  );

  const approveBase = useApprove(
    baseInputAmount,
    environment.base.liquidityManager
  );
  const approveQuote = useApprove(
    quoteInputAmount,
    environment.base.liquidityManager
  );

  const disableReason = useMemo(
    () =>
      lendgineInfo.isLoading
        ? "Loading"
        : // : lendgineInfo.data?.totalLiquidity.equalTo(0)
        // ? "No liquidity in pair"
        !baseInputAmount || !quoteInputAmount
        ? "Enter an amount"
        : baseBalance.isLoading ||
          quoteBalance.isLoading ||
          !approveBase.allowanceQuery ||
          approveBase.allowanceQuery.isLoading ||
          !approveQuote.allowanceQuery ||
          approveQuote.allowanceQuery.isLoading ||
          !deposit
        ? "Loading"
        : (baseBalance.data && baseInputAmount.greaterThan(baseBalance.data)) ||
          (quoteBalance.data && quoteInputAmount.greaterThan(quoteBalance.data))
        ? "Insufficient amount"
        : null,
    [
      approveBase.allowanceQuery,
      approveQuote.allowanceQuery,
      baseBalance.data,
      baseBalance.isLoading,
      baseInputAmount,
      deposit,
      lendgineInfo.isLoading,
      quoteBalance.data,
      quoteBalance.isLoading,
      quoteInputAmount,
    ]
  );

  return (
    <>
      <div tw="flex flex-col rounded-lg border border-gray-200">
        <AssetSelection
          tw="pb-2"
          label={<span>Input</span>}
          selectedValue={base}
          inputValue={
            baseInput === ""
              ? baseInputAmount?.toSignificant(5) ?? ""
              : baseInput
          }
          inputOnChange={(value) => {
            onInput(value, "base");
          }}
          currentAmount={{
            amount: baseBalance.data,
            allowSelect: true,
          }}
        />
        <div tw=" border-b w-full border-gray-200" />
        <CenterSwitch icon="plus" />
        <AssetSelection
          label={<span>Input</span>}
          tw="pt-4"
          selectedValue={quote}
          inputValue={
            quoteInput === ""
              ? quoteInputAmount?.toSignificant(5) ?? ""
              : quoteInput
          }
          inputOnChange={(value) => {
            onInput(value, "quote");
          }}
          currentAmount={{
            amount: quoteBalance.data,
            allowSelect: true,
          }}
        />
      </div>

      <AsyncButton
        variant="primary"
        disabled={!!disableReason}
        tw=" h-12 text-lg"
        onClick={async () => {
          invariant(deposit);
          await Beet(deposit);

          onInput("", "base");
          onInput("", "quote");
        }}
      >
        {disableReason ?? "Add liquidity"}
      </AsyncButton>
    </>
  );
};
