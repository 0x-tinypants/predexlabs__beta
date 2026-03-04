import { useState } from "react";
import "./CreateP2PForm.css";

export default function CreateP2PForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [stake, setStake] = useState(100);
  const [opponent, setOpponent] = useState("");

  function handleSubmit() {
    if (!description.trim()) {
      alert("Description is required.");
      return;
    }

    if (!deadline) {
      alert("Deadline is required.");
      return;
    }

    if (!opponent.trim()) {
      alert("Opponent wallet address is required.");
      return;
    }

    if (stake <= 0) {
      alert("Stake must be greater than 0.");
      return;
    }

    // Convert deadline to UNIX timestamp (seconds)
    const unixDeadline = Math.floor(
      new Date(deadline).getTime() / 1000
    );

    const wager = {
      style: "P2P" as const,
      description,
      deadline: unixDeadline,
      stakePerParticipant: stake,
      sideB: opponent.trim(), // partyA is msg.sender in contract
    };

    onSubmit(wager);
  }

  return (
    <div className="p2p-container">
      {/* DESCRIPTION */}
      <div className="p2p-hero">
        <label>Wager Description</label>
        <textarea
          placeholder="Describe the wager clearly..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* PARAMETERS */}
      <div className="p2p-panel">
        <div className="p2p-row">
          <div className="p2p-field">
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <div className="p2p-field">
          <label>Stake Per Participant</label>
          <input
            type="number"
            min="0"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />
        </div>

        <div className="p2p-field">
          <label>Opponent Wallet Address</label>
          <input
            placeholder="0x..."
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p2p-actions">
        <button className="p2p-cancel" onClick={onCancel}>
          Cancel
        </button>

        <button className="p2p-primary" onClick={handleSubmit}>
          Create P2P Wager
        </button>
      </div>
    </div>
  );
}