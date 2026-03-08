export interface ProfileIdentity {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface ProfileStats {
  wins: number;
  losses: number;
  pushes: number;
  totalWagers: number;
  totalVolumeEth: number;
}

export interface ProfileMeta {
  createdAt: number;
  lastLoginAt: number;
  authProvider: "metamask" | "web3auth";
}

export interface ProfileGolf {
  ghinId?: string | null;
  handicapIndex?: number | null;
  verified?: boolean;
}

export interface Profile {
  wallet: string;
  identity: ProfileIdentity;
  stats: ProfileStats;
  meta: ProfileMeta;
  golf?: ProfileGolf;
}