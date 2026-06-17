import type { ModerationListingRecord } from "@/modules/listing-moderation/types";

export const listingModerationSeed: ModerationListingRecord[] = [
  {
    id: "listing-stay-001",
    kind: "stay",
    partnerName: "Amina Yusuf",
    businessName: "North Harbour Stays",
    partnerUserId: "partner-user-001",
    title: "North Harbour Marina Suites",
    locationLabel: "Lagos, Nigeria",
    status: "pending",
    submittedAt: "2026-04-17T09:20:00.000Z",
    lastReviewedAt: "2026-04-17T10:05:00.000Z",
    summary: "Boutique waterfront stay with 12 suites, rooftop dining, and airport pickup.",
    moderationFeedback:
      "Partner submission is pending review. Room setup exists, but the lead description still needs a clearer amenities summary.",
    escalationNote: "High-visibility launch partner. Prioritize same-day moderation response.",
    media: [
      {
        id: "media-stay-1",
        fileName: "marina-suites-hero.jpg",
        fileType: "image/jpeg",
        uploadedAt: "2026-04-17T09:10:00.000Z",
        previewSummary: "Hero exterior shot showing marina frontage and property entrance.",
        securePath: "/api/backend/moderation/listings/listing-stay-001/media/media-stay-1/download",
      },
      {
        id: "media-stay-2",
        fileName: "marina-suites-deluxe-room.jpg",
        fileType: "image/jpeg",
        uploadedAt: "2026-04-17T09:12:00.000Z",
        previewSummary: "Deluxe room interior with king bed, work desk, and balcony view.",
        securePath: "/api/backend/moderation/listings/listing-stay-001/media/media-stay-2/download",
      },
    ],
    compliance: {
      completenessScore: 86,
      policyFlags: [],
      duplicateWarnings: [],
      geoSignals: ["Property coordinates align with Lagos waterfront district."],
      requiredFixes: ["Add clearer property description for rooftop dining and suite amenities."],
      manualFlag: false,
    },
    reviewSignals: {
      priorityLabel: "Priority queue",
      pendingAgeLabel: "Submitted 6h ago",
      queueLabel: "Pending stay review",
    },
    history: [
      {
        id: "moderation-hist-1",
        actor: "System",
        action: "Listing submitted",
        timestamp: "2026-04-17 09:20 UTC",
        note: "Stay listing entered the moderation queue from the partner stay submission flow.",
      },
    ],
  },
  {
    id: "listing-transfer-001",
    kind: "transfer",
    partnerName: "David Mensah",
    businessName: "Accra Executive Transfers",
    partnerUserId: "partner-user-002",
    title: "Accra Executive Airport Pickup",
    locationLabel: "Accra, Ghana",
    pickupPoint: "Kotoka International Airport",
    dropoffPoint: "Airport Residential Area",
    city: "Accra",
    area: "Airport City",
    destinationRoutes: [
      {
        destinationCity: "Accra",
        destinationArea: "Airport Road",
        destinationSubArea: "Airport Residential District",
      },
      {
        destinationCity: "Accra",
        destinationArea: "Osu",
        destinationSubArea: "Cantonments",
      },
    ],
    destinationCity: "Accra",
    destinationArea: "Airport Road",
    destinationSubArea: "Airport Residential District",
    status: "pending",
    submittedAt: "2026-04-17T07:45:00.000Z",
    lastReviewedAt: "2026-04-17T08:15:00.000Z",
    summary: "Airport transfer route with executive SUVs, bilingual drivers, and meet-and-greet coverage.",
    moderationFeedback:
      "Vehicle and route details are present, but the coverage-area explanation still needs clearer route limits.",
    media: [
      {
        id: "media-transfer-1",
        fileName: "executive-suv-front.jpg",
        fileType: "image/jpeg",
        uploadedAt: "2026-04-17T07:31:00.000Z",
        previewSummary: "Executive SUV fleet image showing branded vehicle exterior and luggage capacity.",
        securePath: "/api/backend/moderation/listings/listing-transfer-001/media/media-transfer-1/download",
      },
      {
        id: "media-transfer-2",
        fileName: "airport-meet-greet.jpg",
        fileType: "image/jpeg",
        uploadedAt: "2026-04-17T07:33:00.000Z",
        previewSummary: "Airport arrival meet-and-greet visual used on the transfer detail page.",
        securePath: "/api/backend/moderation/listings/listing-transfer-001/media/media-transfer-2/download",
      },
    ],
    compliance: {
      completenessScore: 79,
      policyFlags: [],
      duplicateWarnings: ["Similar transfer route already exists for Kotoka to Airport Residential."],
      geoSignals: ["Coverage area includes Kotoka International Airport and central Accra hotels."],
      requiredFixes: ["Clarify route boundaries and update vehicle features for executive tier."],
      manualFlag: false,
    },
    reviewSignals: {
      priorityLabel: "Needs decision",
      pendingAgeLabel: "Submitted 8h ago",
      queueLabel: "Pending transfer review",
    },
    history: [
      {
        id: "moderation-hist-2",
        actor: "System",
        action: "Listing submitted",
        timestamp: "2026-04-17 07:45 UTC",
        note: "Transfer listing entered the moderation queue from the partner transfer submission flow.",
      },
    ],
  },
  {
    id: "listing-stay-002",
    kind: "stay",
    partnerName: "Maya Patel",
    businessName: "Savannah Retreat Collections",
    partnerUserId: "partner-user-003",
    title: "Savannah Retreat River Lodge",
    locationLabel: "Nairobi, Kenya",
    status: "live",
    submittedAt: "2026-04-14T11:30:00.000Z",
    lastReviewedAt: "2026-04-16T13:10:00.000Z",
    summary: "Live safari-adjacent lodge listing with river-view suites and wildlife excursions.",
    moderationFeedback:
      "Listing is live, but a new complaint requires urgent content review for safety-language accuracy.",
    escalationNote: "Potential safety mismatch in excursion claims. Review for emergency unpublish.",
    media: [
      {
        id: "media-stay-live-1",
        fileName: "river-lodge-hero.jpg",
        fileType: "image/jpeg",
        uploadedAt: "2026-04-14T11:12:00.000Z",
        previewSummary: "River-facing lodge exterior used on the live listing hero block.",
        securePath: "/api/backend/moderation/listings/listing-stay-002/media/media-stay-live-1/download",
      },
    ],
    compliance: {
      completenessScore: 94,
      policyFlags: ["Safety claim review requested after customer-support escalation."],
      duplicateWarnings: [],
      geoSignals: ["Geo coverage matches published Nairobi conservation-area coordinates."],
      requiredFixes: ["Verify wildlife-excursion safety text before the listing remains public."],
      manualFlag: true,
    },
    reviewSignals: {
      priorityLabel: "Escalated risk",
      pendingAgeLabel: "Escalated 1d ago",
      queueLabel: "Live listing escalation",
    },
    history: [
      {
        id: "moderation-hist-3",
        actor: "Reviewer lane",
        action: "Listing approved",
        timestamp: "2026-04-15 10:40 UTC",
        note: "Initial stay moderation approved and listing moved to approved.",
      },
      {
        id: "moderation-hist-4",
        actor: "System",
        action: "Listing went live",
        timestamp: "2026-04-16 08:15 UTC",
        note: "Partner published the approved stay listing to live status.",
      },
    ],
  },
];

export function getListingModerationRecords() {
  return listingModerationSeed;
}
