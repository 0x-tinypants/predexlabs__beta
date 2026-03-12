import "./emptyStateTile.css";

type EmptyStateTileProps = {
  title?: string;
  description?: string;
  buttonText?: string;
  onCreate?: () => void;
};

export default function EmptyStateTile({
  title = "No Wagers Yet",
  description = "Challenge another player to start your first wager.",
  buttonText = "+ Create Wager",
  onCreate,
}: EmptyStateTileProps) {
  return (
    <div className="wager-section">
      <div className="wager-grid">

        <div className="wager-tile empty-state">

          <div className="empty-inner">

            <h3>{title}</h3>

            <p>{description}</p>

            {buttonText && (
              <button
                className="empty-create-button"
                onClick={onCreate}
              >
                {buttonText}
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}