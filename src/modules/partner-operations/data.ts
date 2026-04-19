import type { PartnerRecord } from "@/modules/partner-operations/types";

export const partnerRecordsSeed: PartnerRecord[] = [
  {
    id: "partner-001",
    partnerName: "Amina Yusuf",
    businessName: "North Harbour Stays",
    email: "ops@northerharbour.test",
    phone: "+234 801 222 1190",
    region: "Lagos",
    joinedAt: "2026-03-12T09:15:00.000Z",
    lastActiveAt: "2026-04-17T10:25:00.000Z",
    lifecycleState: "verified",
    accountState: "active",
    metadata: {
      marketOwner: "West Africa Supply",
      supportTier: "strategic",
      priority: "priority",
    },
    portfolio: {
      stays: 14,
      transfers: 0,
      liveListings: 11,
      pendingListings: 2,
    },
    operationalNote: "Strategic Lagos stay partner with active expansion request for two additional properties.",
    history: [
      {
        id: "partner-hist-1",
        actor: "Operations Admin",
        action: "Portfolio reviewed",
        timestamp: "2026-04-16 14:10 UTC",
        note: "Confirmed listing backlog and kept partner on strategic support tier.",
      },
    ],
  },
  {
    id: "partner-002",
    partnerName: "David Mensah",
    businessName: "Accra Executive Transfers",
    email: "dispatch@accraexecutive.test",
    phone: "+233 24 555 9021",
    region: "Accra",
    joinedAt: "2026-02-28T12:40:00.000Z",
    lastActiveAt: "2026-04-17T08:12:00.000Z",
    lifecycleState: "pending",
    accountState: "locked",
    metadata: {
      marketOwner: "Mobility Operations",
      supportTier: "elevated",
      priority: "watchlist",
    },
    portfolio: {
      stays: 0,
      transfers: 9,
      liveListings: 6,
      pendingListings: 3,
    },
    operationalNote: "Temporary account lock was applied while verification requested another tax-certificate upload.",
    history: [
      {
        id: "partner-hist-2",
        actor: "Support Admin",
        action: "Account locked",
        timestamp: "2026-04-17 08:00 UTC",
        note: "Locked while compliance follow-up and fleet documentation review were in progress.",
      },
    ],
  },
  {
    id: "partner-003",
    partnerName: "Maya Patel",
    businessName: "Savannah Retreat Collections",
    email: "owner@savannahretreat.test",
    phone: "+254 712 880 144",
    region: "Nairobi",
    joinedAt: "2026-01-10T16:20:00.000Z",
    lastActiveAt: "2026-04-15T19:45:00.000Z",
    lifecycleState: "verified",
    accountState: "archived",
    metadata: {
      marketOwner: "East Africa Supply",
      supportTier: "standard",
      priority: "standard",
    },
    portfolio: {
      stays: 5,
      transfers: 0,
      liveListings: 0,
      pendingListings: 0,
    },
    operationalNote: "Account was archived after the partner requested a seasonal pause across all inventory.",
    history: [
      {
        id: "partner-hist-3",
        actor: "Operations Admin",
        action: "Account archived",
        timestamp: "2026-04-11 09:30 UTC",
        note: "Soft archived on partner request pending seasonal relaunch.",
      },
    ],
  },
];

export function getPartnerRecords() {
  return partnerRecordsSeed;
}
