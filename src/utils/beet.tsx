import React, { useCallback } from "react";
import toast from "react-hot-toast";
import invariant from "tiny-invariant";
import { styled } from "twin.macro";
import type { Address } from "wagmi";
import { useNetwork } from "wagmi";

import { useAwaitTX } from "../hooks/useAwaitTX";

export interface BeetTx {
  tx: () => Promise<{ hash: `0x${string}` }>;
  title: string;
}

export interface BeetStage {
  stageTitle: string;
  parallelTransactions: readonly BeetTx[];
}

const genRanHex = (size: number) => {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < size; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const useBeet = () => {
  const awaitTX = useAwaitTX();
  return useCallback(
    async (stages: readonly BeetStage[]) => {
      const toaster = new DefaultToasterWrapper();

      const random = genRanHex(12); // to prevent toast collisions

      function _generateToasterId(stageIndex: number, localTxIndex: number) {
        console.log(`${random}-${stageIndex}-${localTxIndex}`);
        return `${random}-${stageIndex}-${localTxIndex}`;
      }

      const totaltx = stages.reduce(
        (acc, cur) => acc + cur.parallelTransactions.length,
        0
      );

      for (const [stageIndex, stage] of stages.entries()) {
        const previousTxs = [...Array(stageIndex).keys()].reduce(
          (acc, i) => acc + (stages[i]?.parallelTransactions.length ?? 0),
          0
        );

        // dismiss previous toast
        toaster.dismiss(`${random}-${stageIndex}-pre`);

        const sent = await Promise.all(
          stage.parallelTransactions.map(async (tx, i) => {
            const humanCount = `${1 + i + previousTxs}/${totaltx}`;

            toaster.txLoading(
              _generateToasterId(stageIndex, i),
              tx.title,
              humanCount,
              "Sending transaction"
            );

            try {
              const sent = await tx.tx();

              toaster.txLoading(
                _generateToasterId(stageIndex, i),
                tx.title,
                humanCount,
                "",
                sent.hash
              );
              return { ...sent, tx };
            } catch (err) {
              console.error(typeof err, err);
              toaster.txError(
                _generateToasterId(stageIndex, i),
                tx.title,
                humanCount,
                "Error sending transaction"
              );
              return undefined;
            }
          })
        );

        // if any are undefined then return

        if (sent.find((t) => t === undefined) !== undefined) return;

        const nextStage = stages[stageIndex + 1];
        if (nextStage) {
          toaster.generalToast({
            type: "loading",
            id: `${random}-${stageIndex + 1}-pre`,
            title: nextStage.stageTitle,
            message: `Waiting for previous transaction${
              stage.parallelTransactions.length ? "s" : ""
            }...`,
            duration: 30_000,
          });
        }

        await Promise.all(
          sent.map(async (tx, i) => {
            const humanCount = `${1 + i + previousTxs}/${totaltx}`;

            invariant(tx);

            // TODO: what if the transaction already was confirmed
            const rec = await awaitTX(tx.hash);
            if (rec.status === 0) {
              toaster.dismiss(`${random}-general`);
              toaster.txError(
                _generateToasterId(stageIndex, i),
                tx.tx.title,
                humanCount,
                "Transaction reverted",
                rec.transactionHash
              );
              return;
            }
            toaster.txSuccess(
              _generateToasterId(stageIndex, i),
              tx.tx.title,
              humanCount,
              "",
              tx.hash
            );
          })
        );
      }
    },
    [awaitTX]
  );
};

type GeneralToastArgs = {
  type: "loading" | "success" | "error";
  id: string;
  title: string;
  message: string | JSX.Element | React.ReactNode;
  humanCount?: string;
  duration?: number;
};

export class DefaultToasterWrapper {
  // style = tw`p-4 rounded-xl min-w-[300px]`;

  txLoading(
    id: string,
    title: string,
    humanCount: string,
    txDescription: string,
    txHash?: string
  ): void {
    toast.loading(
      this._buildToastContainer(
        title,
        humanCount,
        () => {
          toast.dismiss(id);
        },
        txDescription,
        txHash
      ),
      {
        id,
        duration: 10000,
        position: "bottom-left",
      }
    );
    return;
  }
  txError(
    // TODO: These fucntions can be combined into 1 just like generalToast
    id: string,
    title: string,
    humanCount: string,
    message: string,
    txHash?: string
  ): void {
    toast.error(
      this._buildToastContainer(
        title,
        humanCount,
        () => {
          toast.dismiss(id);
        },
        message,
        txHash
      ),
      {
        id,
        duration: 6000,
        position: "bottom-left",
      }
    );
    return;
  }
  txSuccess(
    id: string,
    title: string,
    humanCount: string,
    txDescription: string,
    txHash: string
  ): void {
    toast.success(
      this._buildToastContainer(
        title,
        humanCount,
        () => {
          toast.dismiss(id);
        },
        txDescription,
        txHash
      ),
      {
        id,
        duration: 3000,
        position: "bottom-left",
      }
    );
    return;
  }

  dismiss(id: string): void {
    toast.dismiss(id);
  }

  generalToast({
    type,
    id,
    title,
    message,
    duration,
    humanCount,
  }: GeneralToastArgs): void {
    if (!duration) {
      duration = 7000;
    }
    console.log(id, title, message);
    const toastHandler = toast[type];
    toastHandler(
      <ToastContainer tw="flex flex-col overflow-hidden">
        <div tw="flex font-semibold justify-between items-center">
          <span tw="flex items-center gap-1">
            {title}
            {humanCount && (
              <span tw="flex text-sm text-secondary">({humanCount})</span>
            )}
          </span>
          <ToastExitButton onClick={() => toast.dismiss(id)}>×</ToastExitButton>
        </div>

        <div tw="flex text-secondary">
          <div>{message}</div>
        </div>
      </ToastContainer>,
      {
        id,
        duration,
        position: "bottom-left",
      }
    );
    return;
  }

  private _buildToastContainer(
    title: string,
    humanCount: string,
    dismiss: () => void,
    txDescription?: string,
    hash?: string
  ) {
    return (
      <ToastContainer tw="flex flex-col overflow-hidden">
        <div tw="flex font-semibold justify-between items-center">
          <span tw="flex items-center gap-1">
            {title}
            <span tw="flex text-sm text-secondary">({humanCount})</span>
          </span>
          <ToastExitButton onClick={dismiss}>×</ToastExitButton>
        </div>

        <div tw="flex text-secondary">
          {hash ? (
            <div>
              View Transaction: {/* TODO: update the explorer based on chain */}
              <AddressLink address={hash} data="tx" />
            </div>
          ) : (
            <div>{txDescription}</div>
          )}
        </div>
      </ToastContainer>
    );
  }
}

export const AddressLink: React.FC<{
  address: Address | string;
  data: "tx" | "address";
  className?: string;
}> = ({ address, className, data }) => {
  const { chain } = useNetwork();
  return (
    <a
      href={`${
        chain?.blockExplorers?.default.url ?? "https://arbiscan.io"
      }/${data}/${address}`}
      rel="noopener noreferrer"
      target="_blank"
      className={className}
    >
      {address.slice(0, 6)}...{address.slice(address.length - 4)}
    </a>
  );
};

const ToastContainer = styled.div`
  width: 290px;
`;

const ToastExitButton = styled.span`
  font-size: 20px;
  cursor: pointer;
  color: #888d9b;

  &:hover {
    color: #000;
  }
`;
