import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getFinancialOpsRecords } from "@/modules/financial-ops/data";
import { FinancialOpsDetailPanel } from "@/modules/financial-ops/detail-panel";

describe("FinancialOpsDetailPanel", () => {
  it("surfaces source context, supply type, trace summary, and refund exposure", () => {
    const record = getFinancialOpsRecords()[1];

    render(
      <FinancialOpsDetailPanel
        availableActions={[]}
        feedback={null}
        note={record.operationalNote}
        onAction={vi.fn()}
        onNoteChange={vi.fn()}
        onResetSelection={vi.fn()}
        pendingAction={null}
        policySummary="Finance can supervise settlement and refund trails."
        selectedRecord={record}
      />,
    );

    expect(screen.getByText(/supply type/i)).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText(record.sourceContextLabel)).toBeInTheDocument();
    expect(screen.getByText(record.traceSummary)).toBeInTheDocument();
    expect(screen.getByText(/refund exposure/i)).toBeInTheDocument();
  });
});
