import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* UI */
import FilterBar from "../filters/FilterBar";
import WagerSection from "./WagerSection";
import CreateWagerModal from "../wager/CreateWagerModal";
import QuickBetContractModal from "../quickBet/QuickBetContractModal";
import EmptyStateTile from "./EmptyStateTile";

/* State */
import { useEngineState } from "../state/useEngineState";
import { useChainSync } from "../state/useChainSync";
import { useWagerActions } from "../state/useWagerActions";
import { useHomeTiles } from "../state/useHomeTiles";
import { useQuickBetIntent } from "../state/useQuickBetIntent";

type Props = {
  walletAddress: string | null;
  connect: () => void;
};

export default function Home({ walletAddress, connect }: Props) {

  const walletConnected = !!walletAddress;

  const viewerUserId = walletAddress?.toLowerCase() ?? null;

  const navigate = useNavigate();

  /* -----------------------------
   ENGINE STATE
----------------------------- */
  const {
    engineWagers,
    setEngineWagers,
    engineWagersRef,
    counterWagers,
    setCounterWagers,
    engineMarkets,
    setEngineMarkets
  } = useEngineState();

  const { runSync } = useChainSync({
    walletAddress,
    engineWagers,
    setEngineWagers,
    engineWagersRef
  });

  const {
    handleSubmitWager,
    handleAcceptCounterWager,
    handleAcceptP2P,
    handleDeclineP2P,
    handleSelectWinnerP2P,
    handleClaimP2P,
    handleSubmitClaim
  } = useWagerActions({
    walletAddress,
    viewerUserId,
    engineWagers,
    setEngineWagers,
    counterWagers,
    setCounterWagers,
    setEngineMarkets,
    runSync
  });
  /* -----------------------------
     UI STATE
  ----------------------------- */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /* Transaction loader */

  const { intent, openQuickBet, clearQuickBet } = useQuickBetIntent();

  /* -----------------------------
     CREATE WAGER
  ----------------------------- */
  function handleOpenCreate() {
    setActiveCategory("Sports");
    setShowCreateModal(true);
  }


  const { uiWagers, combinedTiles, isEmpty } = useHomeTiles({
    engineWagers,
    counterWagers,
    engineMarkets,
    walletAddress
  });
  /* -----------------------------
     RENDER
  ----------------------------- */
  return (
    <>
      <div className="content-rail content-rail--full">

        <FilterBar
          onCreate={handleOpenCreate}
        />

        {!walletConnected ? (

          <EmptyStateTile
            title="Welcome to PreDEX"
            description="Connect your wallet to start creating and joining wagers."
            buttonText="Connect Wallet"
            onCreate={connect}
          />

        ) : isEmpty ? (

          <EmptyStateTile
            title="No Wagers Yet"
            description="Challenge another player to start your first wager."
            buttonText="+ Create Wager"
            onCreate={handleOpenCreate}
          />

        ) : (

          <WagerSection
            title="Sports"
            wagers={combinedTiles}
            currentUserId={walletAddress ?? ""}
            onQuickBet={openQuickBet}
            onAcceptP2P={handleAcceptP2P}
            onDeclineP2P={handleDeclineP2P}
            onSelectWinnerP2P={handleSelectWinnerP2P}
            onClaimP2P={handleClaimP2P}
          />

        )}

        {showCreateModal && activeCategory && (
          <CreateWagerModal
            category={activeCategory}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleSubmitWager}
          />
        )}

        <QuickBetContractModal
          open={!!intent}
          onClose={clearQuickBet}
          intent={intent}
          wagers={uiWagers}
          engineWagers={engineWagers}
          counterWagers={counterWagers}
          onAccept={handleAcceptCounterWager}
          currentUser={{
            id: viewerUserId ?? "",
            handicapIndex: null,
          }}
        />

      </div>
    </>
  );
}
