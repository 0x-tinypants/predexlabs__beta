import { logger } from "../dev/logger";
import { logLifecycle } from "../dev/lifecycleLogger";

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

    logger.tx("Transaction request started");

    window.dispatchEvent(
      new CustomEvent("predex_tx_start", {
        detail: { message: "Confirm transaction in your wallet..." }
      })
    );

    const tx = await txPromise;

    logger.tx("Transaction submitted", tx.hash);

    window.dispatchEvent(
      new CustomEvent("predex_tx_start", {
        detail: { message: "Transaction submitted — waiting for confirmation..." }
      })
    );

    tx.wait().then(() => {

      logger.tx("Transaction confirmed", tx.hash);

      logLifecycle("ESCROW_DEPLOYED", tx.hash);

      window.dispatchEvent(new Event("predex_tx_end"));

    });

    return tx;

  } catch (err) {

    logger.error("Transaction failed", err);

    window.dispatchEvent(new Event("predex_tx_end"));
    throw err;

  } finally {
    txPending = false;
  }
}