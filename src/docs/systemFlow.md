# PreDEX System Flow

This document defines the exact lifecycle of a wager in PreDEX.
All debugging should follow this pipeline.

---

## Stage 1 — Wallet Connection

User connects wallet via:

- MetaMask
- Web3Auth

Output:
- wallet address stored in state
- wallet address visible in header

Failure indicators:
- wallet null
- wrong network

---

## Stage 2 — Wager Creation

User creates a wager through the Create Wager modal.

Process:

UI → runTransaction.ts → deploy escrow contract

Output:
- escrow contract deployed
- transaction hash returned

Failure indicators:
- transaction rejected
- contract deployment fails

---

## Stage 3 — ChainSync Detection

ChainSync scans blockchain events and detects escrow creation.

Process:

Factory Contract → ChainSync → escrow indexed

Output:
- escrow stored in engine memory

Failure indicators:
- escrow not indexed
- sync pointer ahead of event block

---

## Stage 4 — Engine Construction

Engine builds wager object.

Process:

Escrow Data → wager.engine.ts → engine state

Output:
- wager object created

Failure indicators:
- malformed wager data
- engine state missing wager

---

## Stage 5 — Mapper

Mapper converts engine object → UI tile.

Process:

engine wager → wager.mapper.ts

Output:
- tile data structure

Failure indicators:
- mapper returns null
- incorrect wager type

---

## Stage 6 — UI Rendering

Tile appears in Home.

Process:

useHomeTiles → WagerSection → Tile component

Output:
- visible wager tile

Failure indicators:
- tile filtered
- UI state mismatch