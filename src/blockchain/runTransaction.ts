let txPending = false;

export async function runTransaction(
  txPromise: Promise<any>
) {

  if (txPending) {
    console.warn("Transaction already pending");
    return;
  }

  txPending = true;

  try {

    // Stage 1 — waiting for wallet confirmation
    window.dispatchEvent(
      new CustomEvent("predex_tx_start", {
        detail: { message: "Confirm transaction in your wallet..." }
      })
    );

    const tx = await txPromise;

    // Stage 2 — transaction submitted
    window.dispatchEvent(
      new CustomEvent("predex_tx_start", {
        detail: { message: "Transaction submitted — waiting for confirmation..." }
      })
    );

    const receipt = await tx.wait();

    window.dispatchEvent(new Event("predex_tx_end"));

    return receipt;

  } catch (err) {

    window.dispatchEvent(new Event("predex_tx_end"));
    throw err;

  } finally {
    txPending = false;
  }
}