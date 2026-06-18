export type LocalitySuggestionRecord = {
  id: string;
  partnerId: string;
  country: string;
  state: string;
  city: string;
  area: string;
  subArea: string;
  latitude: number | null;
  longitude: number | null;
  normalizedSlug: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  duplicateCityHints?: string[];
};
