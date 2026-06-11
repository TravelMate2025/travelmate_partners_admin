import type {
  ReportExportRecord,
  ReportSnapshot,
  ReportsRegion,
  ReportsTimeframe,
} from "@/modules/reports/types";

type RegionMetrics = {
  verifiedPartners: number;
  newApprovals: number;
  suspendedPartners: number;
  verificationSubmitted: number;
  verificationRejected: number;
  listingsPending: number;
  listingsLive: number;
  listingsSentBack: number;
  stayListings: number;
  transferListings: number;
  priorityMarkets: number;
  apiClientsApproved: number;
  apiClientsPending: number;
  rateLimitChanges: number;
  totalBookings: number;
  cancelledBookings: number;
  grossRevenue: number;
  staysBooked: number;
  transfersBooked: number;
};

type ReportSourceWindow = {
  timeframe: ReportsTimeframe;
  regions: Exclude<ReportsRegion, "all">[];
  regionalMetrics: Record<Exclude<ReportsRegion, "all">, RegionMetrics>;
};

const reportSourceWindows: ReportSourceWindow[] = [
  {
    timeframe: "7d",
    regions: ["west_africa", "east_africa", "southern_africa"],
    regionalMetrics: {
      west_africa: {
        verifiedPartners: 136,
        newApprovals: 28,
        suspendedPartners: 4,
        verificationSubmitted: 39,
        verificationRejected: 5,
        listingsPending: 21,
        listingsLive: 74,
        listingsSentBack: 9,
        stayListings: 198,
        transferListings: 88,
        priorityMarkets: 4,
        apiClientsApproved: 9,
        apiClientsPending: 2,
        rateLimitChanges: 2,
        totalBookings: 84,
        cancelledBookings: 11,
        grossRevenue: 4200000,
        staysBooked: 61,
        transfersBooked: 23,
      },
      east_africa: {
        verifiedPartners: 92,
        newApprovals: 21,
        suspendedPartners: 3,
        verificationSubmitted: 31,
        verificationRejected: 4,
        listingsPending: 15,
        listingsLive: 51,
        listingsSentBack: 7,
        stayListings: 132,
        transferListings: 61,
        priorityMarkets: 3,
        apiClientsApproved: 6,
        apiClientsPending: 2,
        rateLimitChanges: 1,
        totalBookings: 58,
        cancelledBookings: 7,
        grossRevenue: 2900000,
        staysBooked: 41,
        transfersBooked: 17,
      },
      southern_africa: {
        verifiedPartners: 68,
        newApprovals: 16,
        suspendedPartners: 2,
        verificationSubmitted: 24,
        verificationRejected: 3,
        listingsPending: 12,
        listingsLive: 39,
        listingsSentBack: 5,
        stayListings: 104,
        transferListings: 46,
        priorityMarkets: 2,
        apiClientsApproved: 4,
        apiClientsPending: 1,
        rateLimitChanges: 1,
        totalBookings: 39,
        cancelledBookings: 5,
        grossRevenue: 1950000,
        staysBooked: 28,
        transfersBooked: 11,
      },
    },
  },
  {
    timeframe: "30d",
    regions: ["west_africa", "east_africa", "southern_africa"],
    regionalMetrics: {
      west_africa: {
        verifiedPartners: 248,
        newApprovals: 61,
        suspendedPartners: 6,
        verificationSubmitted: 85,
        verificationRejected: 8,
        listingsPending: 32,
        listingsLive: 132,
        listingsSentBack: 14,
        stayListings: 332,
        transferListings: 151,
        priorityMarkets: 6,
        apiClientsApproved: 14,
        apiClientsPending: 4,
        rateLimitChanges: 4,
        totalBookings: 312,
        cancelledBookings: 38,
        grossRevenue: 15600000,
        staysBooked: 224,
        transfersBooked: 88,
      },
      east_africa: {
        verifiedPartners: 176,
        newApprovals: 46,
        suspendedPartners: 4,
        verificationSubmitted: 64,
        verificationRejected: 6,
        listingsPending: 24,
        listingsLive: 98,
        listingsSentBack: 11,
        stayListings: 241,
        transferListings: 112,
        priorityMarkets: 4,
        apiClientsApproved: 11,
        apiClientsPending: 3,
        rateLimitChanges: 3,
        totalBookings: 214,
        cancelledBookings: 27,
        grossRevenue: 10700000,
        staysBooked: 153,
        transfersBooked: 61,
      },
      southern_africa: {
        verifiedPartners: 132,
        newApprovals: 32,
        suspendedPartners: 3,
        verificationSubmitted: 47,
        verificationRejected: 5,
        listingsPending: 18,
        listingsLive: 74,
        listingsSentBack: 8,
        stayListings: 188,
        transferListings: 83,
        priorityMarkets: 3,
        apiClientsApproved: 7,
        apiClientsPending: 2,
        rateLimitChanges: 2,
        totalBookings: 151,
        cancelledBookings: 19,
        grossRevenue: 7550000,
        staysBooked: 109,
        transfersBooked: 42,
      },
    },
  },
  {
    timeframe: "90d",
    regions: ["west_africa", "east_africa", "southern_africa"],
    regionalMetrics: {
      west_africa: {
        verifiedPartners: 391,
        newApprovals: 98,
        suspendedPartners: 10,
        verificationSubmitted: 133,
        verificationRejected: 12,
        listingsPending: 46,
        listingsLive: 206,
        listingsSentBack: 21,
        stayListings: 516,
        transferListings: 236,
        priorityMarkets: 8,
        apiClientsApproved: 22,
        apiClientsPending: 5,
        rateLimitChanges: 7,
        totalBookings: 891,
        cancelledBookings: 104,
        grossRevenue: 44550000,
        staysBooked: 632,
        transfersBooked: 259,
      },
      east_africa: {
        verifiedPartners: 287,
        newApprovals: 72,
        suspendedPartners: 7,
        verificationSubmitted: 99,
        verificationRejected: 9,
        listingsPending: 35,
        listingsLive: 151,
        listingsSentBack: 16,
        stayListings: 371,
        transferListings: 176,
        priorityMarkets: 5,
        apiClientsApproved: 17,
        apiClientsPending: 4,
        rateLimitChanges: 5,
        totalBookings: 614,
        cancelledBookings: 72,
        grossRevenue: 30700000,
        staysBooked: 436,
        transfersBooked: 178,
      },
      southern_africa: {
        verifiedPartners: 209,
        newApprovals: 52,
        suspendedPartners: 5,
        verificationSubmitted: 73,
        verificationRejected: 7,
        listingsPending: 26,
        listingsLive: 109,
        listingsSentBack: 12,
        stayListings: 263,
        transferListings: 121,
        priorityMarkets: 4,
        apiClientsApproved: 12,
        apiClientsPending: 3,
        rateLimitChanges: 3,
        totalBookings: 431,
        cancelledBookings: 51,
        grossRevenue: 21550000,
        staysBooked: 308,
        transfersBooked: 123,
      },
    },
  },
];

function regionLabel(region: ReportsRegion) {
  switch (region) {
    case "all":
      return "All regions";
    case "west_africa":
      return "West Africa";
    case "east_africa":
      return "East Africa";
    case "southern_africa":
      return "Southern Africa";
  }
}

function timeframeLabel(timeframe: ReportsTimeframe) {
  switch (timeframe) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
  }
}

function getWindow(timeframe: ReportsTimeframe) {
  return reportSourceWindows.find((window) => window.timeframe === timeframe)!;
}

function sumRegionMetrics(metrics: RegionMetrics[]) {
  return metrics.reduce<RegionMetrics>(
    (total, item) => ({
      verifiedPartners: total.verifiedPartners + item.verifiedPartners,
      newApprovals: total.newApprovals + item.newApprovals,
      suspendedPartners: total.suspendedPartners + item.suspendedPartners,
      verificationSubmitted: total.verificationSubmitted + item.verificationSubmitted,
      verificationRejected: total.verificationRejected + item.verificationRejected,
      listingsPending: total.listingsPending + item.listingsPending,
      listingsLive: total.listingsLive + item.listingsLive,
      listingsSentBack: total.listingsSentBack + item.listingsSentBack,
      stayListings: total.stayListings + item.stayListings,
      transferListings: total.transferListings + item.transferListings,
      priorityMarkets: total.priorityMarkets + item.priorityMarkets,
      apiClientsApproved: total.apiClientsApproved + item.apiClientsApproved,
      apiClientsPending: total.apiClientsPending + item.apiClientsPending,
      rateLimitChanges: total.rateLimitChanges + item.rateLimitChanges,
      totalBookings: total.totalBookings + item.totalBookings,
      cancelledBookings: total.cancelledBookings + item.cancelledBookings,
      grossRevenue: total.grossRevenue + item.grossRevenue,
      staysBooked: total.staysBooked + item.staysBooked,
      transfersBooked: total.transfersBooked + item.transfersBooked,
    }),
    {
      verifiedPartners: 0,
      newApprovals: 0,
      suspendedPartners: 0,
      verificationSubmitted: 0,
      verificationRejected: 0,
      listingsPending: 0,
      listingsLive: 0,
      listingsSentBack: 0,
      stayListings: 0,
      transferListings: 0,
      priorityMarkets: 0,
      apiClientsApproved: 0,
      apiClientsPending: 0,
      rateLimitChanges: 0,
      totalBookings: 0,
      cancelledBookings: 0,
      grossRevenue: 0,
      staysBooked: 0,
      transfersBooked: 0,
    },
  );
}

export function getAggregatedReportSource(region: ReportsRegion, timeframe: ReportsTimeframe) {
  const sourceWindow = getWindow(timeframe);
  const metrics =
    region === "all"
      ? sumRegionMetrics(sourceWindow.regionalMetrics ? Object.values(sourceWindow.regionalMetrics) : [])
      : sourceWindow.regionalMetrics[region];

  return {
    region,
    timeframe,
    regionLabel: regionLabel(region),
    timeframeLabel: timeframeLabel(timeframe),
    ...metrics,
  };
}

export function getReportSnapshot(region: ReportsRegion, timeframe: ReportsTimeframe): ReportSnapshot {
  const source = getAggregatedReportSource(region, timeframe);
  const listingConversionPercent = Math.round((source.listingsLive / Math.max(source.listingsLive + source.listingsSentBack, 1)) * 100);
  const totalAll = source.totalBookings + source.cancelledBookings;
  const cancellationRate = totalAll > 0 ? Math.round((source.cancelledBookings / totalAll) * 100 * 10) / 10 : 0;
  const grossRevenueFormatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(source.grossRevenue);

  return {
    id: `reports-${region}-${timeframe}`,
    title: `${source.regionLabel} reporting snapshot`,
    subtitle: `${source.timeframeLabel} · operational and leadership metrics`,
    region,
    timeframe,
    metrics: [
      {
        key: "partner_growth",
        label: "Partner growth",
        value: `${source.verifiedPartners}`,
        note: "Verified partner lifecycle volume in the selected reporting window.",
        accent: "linear-gradient(90deg, #19463e 0%, #2b5f55 100%)",
        badge: { label: `${source.newApprovals} approved`, tone: "success" },
      },
      {
        key: "verification_funnel",
        label: "Verification funnel",
        value: `${source.newApprovals}/${source.verificationSubmitted}`,
        note: "Approved over submitted partner verification cases.",
        accent: "linear-gradient(90deg, #9c5d24 0%, #d9882a 100%)",
        badge: { label: `${source.verificationRejected} rejected`, tone: "warning" },
      },
      {
        key: "listing_conversion",
        label: "Listing conversion",
        value: `${listingConversionPercent}%`,
        note: "Share of moderated listings progressing to live state.",
        accent: "linear-gradient(90deg, #1e5970 0%, #2e6f8c 100%)",
        badge: { label: `${source.listingsSentBack} sent back`, tone: "info" },
      },
      {
        key: "supply_mix",
        label: "Supply mix",
        value: `${source.stayListings + source.transferListings}`,
        note: "Live supply volume across stays and transfers for the selected context.",
        accent: "linear-gradient(90deg, #5f3f60 0%, #7c5c7f 100%)",
        badge: { label: `${source.priorityMarkets} priority markets`, tone: "neutral" },
      },
      {
        key: "api_adoption",
        label: "API adoption",
        value: `${source.apiClientsApproved}`,
        note: "Approved API-enabled partners and governance activity in the selected window.",
        accent: "linear-gradient(90deg, #2f4858 0%, #40667a 100%)",
        badge: { label: `${source.rateLimitChanges} quota changes`, tone: "info" },
      },
      {
        key: "booking_activity",
        label: "Booking activity",
        value: `${source.totalBookings}`,
        note: "Reservation-lifecycle bookings in active states for the selected window; this is not a payment-settled metric.",
        accent: "linear-gradient(90deg, #1a3a5c 0%, #2e5f8a 100%)",
        badge: { label: `${source.cancelledBookings} cancelled`, tone: "warning" },
      },
    ],
    partnerGrowth: [
      { id: "pg-1", label: "Verified partners", value: `${source.verifiedPartners}`, note: "Partners in a verified lifecycle state." },
      { id: "pg-2", label: "New approvals", value: `${source.newApprovals}`, note: "Partners approved within the selected timeframe." },
      { id: "pg-3", label: "Suspended", value: `${source.suspendedPartners}`, note: "Admin lifecycle suspensions requiring follow-up." },
    ],
    verificationFunnel: [
      { id: "vf-1", label: "Submitted", value: `${source.verificationSubmitted}`, note: "Verification cases entering admin review." },
      { id: "vf-2", label: "Approved", value: `${source.newApprovals}`, note: "Partners advanced into verified lifecycle." },
      { id: "vf-3", label: "Rejected", value: `${source.verificationRejected}`, note: "Rejected cases across the reporting period." },
    ],
    listingConversion: [
      { id: "lc-1", label: "Pending moderation", value: `${source.listingsPending}`, note: "Listings awaiting review." },
      { id: "lc-2", label: "Approved to live", value: `${source.listingsLive}`, note: "Listings progressing to live state." },
      { id: "lc-3", label: "Sent back for edits", value: `${source.listingsSentBack}`, note: "Listings needing partner corrections." },
    ],
    supplyMix: [
      { id: "sm-1", label: "Stays", value: `${source.stayListings}`, note: "Live stay inventory." },
      { id: "sm-2", label: "Transfers", value: `${source.transferListings}`, note: "Live transfer inventory." },
      { id: "sm-3", label: "Priority markets", value: `${source.priorityMarkets}`, note: "High-signal supply markets in this window." },
    ],
    apiAdoption: [
      { id: "aa-1", label: "Approved API clients", value: `${source.apiClientsApproved}`, note: "Partners with active API adoption." },
      { id: "aa-2", label: "Pending review", value: `${source.apiClientsPending}`, note: "Applications still in admin review." },
      { id: "aa-3", label: "Rate-limit changes", value: `${source.rateLimitChanges}`, note: "Quota changes recorded in the selected period." },
    ],
    bookingActivity: [
      { id: "ba-1", label: "Total bookings", value: `${source.totalBookings}`, note: "Reservation-lifecycle bookings in active states within the reporting window." },
      { id: "ba-2", label: "Cancelled bookings", value: `${source.cancelledBookings}`, note: "Cancellations recorded in the reporting window." },
      { id: "ba-3", label: "Gross booked value", value: grossRevenueFormatted, note: "Sum of gross amounts from reservation records counted in booking activity; not a payment-settled total." },
      { id: "ba-4", label: "Cancellation rate", value: `${cancellationRate}%`, note: "Cancelled bookings as a share of all bookings." },
      { id: "ba-5", label: "Stays booked", value: `${source.staysBooked}`, note: "Booking volume from stay-type listings." },
      { id: "ba-6", label: "Transfers booked", value: `${source.transfersBooked}`, note: "Booking volume from transfer-type listings." },
    ],
    narrative: `${source.regionLabel} shows ${source.newApprovals} new approvals feeding verified partner growth, ${listingConversionPercent}% listing conversion to live supply, ${source.apiClientsApproved} approved API clients, and ${source.totalBookings} active reservation-lifecycle bookings in ${source.timeframeLabel.toLowerCase()}.`,
  };
}

export function getInitialReportExports() {
  return [
    {
      id: "report-export-001",
      actor: "Amina Bello",
      region: "all" as const,
      timeframe: "30d" as const,
      fileName: "travelmate-report-all-30d.csv",
      exportedAt: "18/04/2026 11:20 UTC",
      includedSections: ["partner_growth", "verification_funnel", "listing_conversion", "supply_mix", "api_adoption", "booking_activity"],
      sectionLabels: ["Partner growth", "Verification funnel", "Listing conversion", "Supply mix", "API adoption", "Booking activity"],
      contextSummary: "All regions · Last 30 days · 5 sections",
      csvPreviewRows: [
        "section,label,value,note",
        "partner_growth,Verified partners,556,Partners in a verified lifecycle state.",
        "verification_funnel,Submitted,196,Verification cases entering admin review.",
      ],
    },
  ] satisfies ReportExportRecord[];
}
