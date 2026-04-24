import type { AdminRole } from "@/modules/auth/types";
import type { PartnerLifecycleState } from "@/modules/verification-review/types";

export type PartnerAccountState = "active" | "locked" | "archived";
export type PartnerPriority = "standard" | "priority" | "watchlist";
export type SupportTier = "standard" | "elevated" | "strategic";
export type PartnerAction = "lock" | "unlock" | "restore" | "update_metadata";

export type PartnerPortfolioSummary = {
  stays: number;
  transfers: number;
  liveListings: number;
  pendingListings: number;
};

export type PartnerOperatingCoverage = {
  countries: string[];
  regions: string[];
  cities: string[];
  coverageNotes: string;
};

export type PartnerPayoutSetup = {
  payoutMethod: "bank_transfer" | "mobile_money";
  settlementCurrency: string;
  payoutSchedule: "manual" | "daily" | "weekly";
  settlementTrigger: "service_completion";
};

export type PartnerMetadata = {
  marketOwner: string;
  supportTier: SupportTier;
  priority: PartnerPriority;
};

export type PartnerHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type PartnerRecord = {
  id: string;
  partnerName: string;
  businessName: string;
  email: string;
  phone: string;
  region: string;
  joinedAt: string;
  lastActiveAt: string;
  lifecycleState: PartnerLifecycleState;
  accountState: PartnerAccountState;
  metadata: PartnerMetadata;
  portfolio: PartnerPortfolioSummary;
  operatingCoverage: PartnerOperatingCoverage;
  payoutSetup: PartnerPayoutSetup;
  operationalNote: string;
  history: PartnerHistoryEntry[];
};

export type PartnerFilterState = {
  query: string;
  lifecycle: PartnerLifecycleState | "all";
  accountState: PartnerAccountState | "all";
  region: string | "all";
};

export type PartnerMetadataUpdatePayload = {
  marketOwner: string;
  supportTier: SupportTier;
  priority: PartnerPriority;
  note: string;
};

export type PartnerActionPayload =
  | {
      type: "lock" | "unlock" | "restore";
      partnerId: string;
      actor: string;
      note: string;
    }
  | {
      type: "update_metadata";
      partnerId: string;
      actor: string;
      note: string;
      metadata: PartnerMetadataUpdatePayload;
    };

export type PartnerActionResult = {
  records: PartnerRecord[];
  updatedRecord: PartnerRecord;
  auditMessage: string;
};

export type PartnerPolicy = {
  canEditMetadata: boolean;
  canLock: boolean;
  canUnlock: boolean;
  canRestore: boolean;
};

export type PartnerRoutePolicySummary = {
  role: AdminRole;
  summary: string;
};
