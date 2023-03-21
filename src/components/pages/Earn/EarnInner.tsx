import { NavLink } from "react-router-dom";

import { Button } from "../../common/Button";
import { PageMargin } from "../../layout";
import { Markets } from "./Markets";

export const EarnInner: React.FC = () => {
  return (
    <PageMargin tw="w-full pb-12 sm:pb-0 flex flex-col  gap-2">
      <div tw="w-full max-w-5xl rounded bg-white  border border-[#dfdfdf]   pt-12 md:pt-20 px-6 pb-6 shadow">
        <div tw="flex flex-col lg:flex-row lg:justify-between gap-4 lg:items-center">
          <p tw="font-bold text-4xl">Provide Liquidity</p>
          <div tw="gap-2 grid">
            <p tw=" text-lg text-[#8f8f8f] max-w-md">
              Provide liquidity to an automated market maker and earn interest
              from lending out your position.
            </p>
            <NavLink to="/create" tw="">
              <Button variant="primary" tw="px-2 py-1 ">
                Create new market
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
      <Markets />
    </PageMargin>
  );
};
