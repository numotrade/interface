import { NavLink } from "react-router-dom";
import invariant from "tiny-invariant";

import { useEnvironment } from "../../../contexts/environment";
import { Button } from "../../common/Button";
import { EmptyPosition } from "./EmptyPosition";
import { PositionCard } from "./PositionCard";

export const Pool: React.FC = () => {
  const { markets } = useEnvironment();

  const market = markets[0];
  invariant(market);

  return (
    <div tw="w-full max-w-2xl flex flex-col gap-2">
      <div tw="flex justify-between w-full">
        <p tw="text-default font-semibold text-2xl">Your Positions</p>
        <NavLink to="/pool/create-position">
          <Button variant="primary">New Position</Button>
        </NavLink>
      </div>
      <EmptyPosition />
      <PositionCard market={market} />
    </div>
  );
};
