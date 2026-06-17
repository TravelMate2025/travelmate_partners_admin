import { render, screen } from "@testing-library/react";

import { ListingModerationDetailPanel } from "@/modules/listing-moderation/detail-panel";
import { listingModerationSeed } from "@/modules/listing-moderation/data";

const noop = () => {};

describe("ListingModerationDetailPanel", () => {
  it("shows transfer route cards with canonical route fields", () => {
    const record = listingModerationSeed.find((item) => item.kind === "transfer")!;

    render(
      <ListingModerationDetailPanel
        selectedRecord={record}
        activeMediaId={record.media[0]?.id ?? ""}
        selectedIds={[record.id]}
        reasonCode="content_quality"
        note=""
        feedback={null}
        pendingAction={null}
        allowedActions={null}
        allowedBulkActions={{
          approve: false,
          reject: false,
          send_back: false,
          flag: false,
          emergency_unpublish: false,
        }}
        canBulkUpdate={false}
        onSelectMedia={noop}
        onReasonCodeChange={noop}
        onNoteChange={noop}
        onAction={noop}
        onBulkAction={noop}
        onCityAction={noop}
        pendingCityAction={null}
        mergeTargetCity=""
        onMergeTargetCityChange={noop}
        onResetSelection={noop}
      />,
    );

    expect(screen.getByText("Pickup note (as entered by partner)")).toBeInTheDocument();
    expect(screen.getByText("Canonical Route")).toBeInTheDocument();
    expect(screen.getByText("Kotoka International Airport")).toBeInTheDocument();
    expect(screen.getByText("Route 1")).toBeInTheDocument();
    expect(screen.getByText("Route 2")).toBeInTheDocument();
    expect(screen.getByText("Accra — Airport Road — Airport Residential District")).toBeInTheDocument();
    expect(screen.getByText("Accra — Osu — Cantonments")).toBeInTheDocument();
  });

  it("does not render the route section for stays", () => {
    const record = listingModerationSeed.find((item) => item.kind === "stay")!;

    render(
      <ListingModerationDetailPanel
        selectedRecord={record}
        activeMediaId={record.media[0]?.id ?? ""}
        selectedIds={[record.id]}
        reasonCode="content_quality"
        note=""
        feedback={null}
        pendingAction={null}
        allowedActions={null}
        allowedBulkActions={{
          approve: false,
          reject: false,
          send_back: false,
          flag: false,
          emergency_unpublish: false,
        }}
        canBulkUpdate={false}
        onSelectMedia={noop}
        onReasonCodeChange={noop}
        onNoteChange={noop}
        onAction={noop}
        onBulkAction={noop}
        onCityAction={noop}
        pendingCityAction={null}
        mergeTargetCity=""
        onMergeTargetCityChange={noop}
        onResetSelection={noop}
      />,
    );

    expect(screen.queryByText("Canonical Route")).not.toBeInTheDocument();
  });
});
