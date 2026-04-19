import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getAccessPolicyEntries, getAuditLogEntries, getRetentionConfig } from "@/modules/audit-compliance/data";
import { AuditComplianceWorkspace } from "@/modules/audit-compliance/workspace";

const defaultProps = {
  initialEntries: getAuditLogEntries(),
  actor: "Kwame Asante",
  role: "super_admin" as const,
  retentionConfig: getRetentionConfig(),
  accessPolicyEntries: getAccessPolicyEntries(),
};

describe("AuditComplianceWorkspace", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders the audit log and selects the first entry by default", () => {
    render(<AuditComplianceWorkspace {...defaultProps} />);

    expect(screen.getByText("Critical action traces")).toBeInTheDocument();
    expect(screen.getAllByText(/Fatima Al-Hassan/i).length).toBeGreaterThan(0);
  });

  it("loads filter state and selected entry from URL params", () => {
    window.history.replaceState(null, "", "/audit-compliance?category=financial&entry=audit-010");

    render(<AuditComplianceWorkspace {...defaultProps} />);

    expect(screen.getByLabelText("Audit category")).toHaveValue("financial");
    expect(screen.getAllByText(/East Africa stays/i).length).toBeGreaterThan(0);
  });

  it("filters audit entries by category", () => {
    render(<AuditComplianceWorkspace {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("Audit category"), {
      target: { value: "financial" },
    });

    const allEntries = getAuditLogEntries();
    const financialCount = allEntries.filter((e) => e.category === "financial").length;
    const cards = screen.getAllByRole("button").filter((b) => b.className.includes("tm-document-card"));
    expect(cards.length).toBe(financialCount);
  });

  it("filters audit entries by query matching actor", () => {
    render(<AuditComplianceWorkspace {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("Search audit log"), {
      target: { value: "Priya" },
    });

    const allEntries = getAuditLogEntries();
    const priyaCount = allEntries.filter((e) => e.actor.includes("Priya")).length;
    const cards = screen.getAllByRole("button").filter((b) => b.className.includes("tm-document-card"));
    expect(cards.length).toBe(priyaCount);
  });

  it("exports compliance data and shows export record", async () => {
    render(<AuditComplianceWorkspace {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("Export reason"), {
      target: { value: "Exporting full audit log for Q1 internal compliance review process." },
    });
    fireEvent.click(screen.getByLabelText("Export compliance data"));

    await waitFor(() => {
      expect(screen.getByText(/exported.*audit/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/travelmate-audit-export-/i).length).toBeGreaterThan(0);
  });

  it("shows export restriction message for reviewer role", () => {
    render(
      <AuditComplianceWorkspace
        {...defaultProps}
        role="reviewer"
        actor="Priya Sharma"
      />,
    );

    expect(screen.queryByLabelText("Export compliance data")).not.toBeInTheDocument();
    expect(screen.getByText(/read only|cannot export|restricted/i)).toBeInTheDocument();
  });

  it("hides admin_access category option for finance role", () => {
    render(
      <AuditComplianceWorkspace
        {...defaultProps}
        role="finance"
        actor="Tunde Adebayo"
      />,
    );

    const categorySelect = screen.getByLabelText("Audit category");
    const options = Array.from(categorySelect.querySelectorAll("option")).map((o) => o.value);
    expect(options).not.toContain("admin_access");
  });

  it("shows retention controls only for super_admin", () => {
    const { rerender } = render(<AuditComplianceWorkspace {...defaultProps} role="super_admin" />);
    expect(screen.getByText("Data retention controls")).toBeInTheDocument();

    rerender(<AuditComplianceWorkspace {...defaultProps} role="operations" />);
    expect(screen.queryByText("Data retention controls")).not.toBeInTheDocument();
  });

  it("shows access policy section for super_admin and operations", () => {
    const { rerender } = render(<AuditComplianceWorkspace {...defaultProps} role="super_admin" />);
    expect(screen.getByText("Role-based audit access")).toBeInTheDocument();

    rerender(<AuditComplianceWorkspace {...defaultProps} role="operations" />);
    expect(screen.getByText("Role-based audit access")).toBeInTheDocument();

    rerender(<AuditComplianceWorkspace {...defaultProps} role="finance" />);
    expect(screen.queryByText("Role-based audit access")).not.toBeInTheDocument();
  });

  it("renders empty state when initial entries are empty", () => {
    render(<AuditComplianceWorkspace {...defaultProps} initialEntries={[]} />);
    expect(screen.getByText("Audit log is empty")).toBeInTheDocument();
  });

  it("renders empty filter state when no entries match the filter", () => {
    render(<AuditComplianceWorkspace {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("Search audit log"), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getAllByText("No audit events match this view").length).toBeGreaterThan(0);
  });

  it("resets filters on reset button click", () => {
    render(<AuditComplianceWorkspace {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("Search audit log"), {
      target: { value: "Tunde" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByLabelText("Search audit log")).toHaveValue("");
  });
});
