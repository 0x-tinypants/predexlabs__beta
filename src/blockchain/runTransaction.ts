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

    window.dispatchEvent(
      new CustomEvent("predex_tx_start", {
        detail: { message: "Confirm transaction in your wallet..." }
      })
    );

    const tx = await txPromise;

    window.dispatchEvent(
      new CustomEvent("predex_tx_start", {
        detail: { message: "Transaction submitted — waiting for confirmation..." }
      })
    );

    // 🔥 Confirmation happens in background
    tx.wait().then(() => {
      window.dispatchEvent(new Event("predex_tx_end"));
    });

    return tx;

  } catch (err) {

    window.dispatchEvent(new Event("predex_tx_end"));
    throw err;

  } finally {
    txPending = false;
  }
}