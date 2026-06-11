import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BookingPricingRulesPanel } from "@/modules/system-config/booking-pricing-rules-panel";

type RuleStatus = "active" | "inactive";

type TaxRule = {
  id: string;
  name: string;
  status: RuleStatus;
  country: string;
  city: string;
  currency: string;
  calculationMode: "percentage" | "fixed";
  value: number;
  isInclusive: boolean;
  priority: number;
};

type FeeRule = {
  id: string;
  name: string;
  feeType: "platform_fee" | "service_fee" | "payment_fee";
  status: RuleStatus;
  country: string;
  city: string;
  currency: string;
  calculationMode: "percentage" | "fixed";
  value: number;
  minAmount: number;
  maxAmount: number | null;
  priority: number;
};

describe("BookingPricingRulesPanel", () => {
  let taxRules: TaxRule[];
  let feeRules: FeeRule[];

  beforeEach(() => {
    taxRules = [
      {
        id: "tax-active",
        name: "Nigeria VAT",
        status: "active",
        country: "NG",
        city: "",
        currency: "NGN",
        calculationMode: "percentage",
        value: 7.5,
        isInclusive: false,
        priority: 100,
      },
      {
        id: "tax-inactive",
        name: "Lagos City Tax",
        status: "inactive",
        country: "NG",
        city: "Lagos",
        currency: "NGN",
        calculationMode: "fixed",
        value: 1000,
        isInclusive: false,
        priority: 200,
      },
    ];

    feeRules = [
      {
        id: "fee-active",
        name: "Platform Fee",
        feeType: "platform_fee",
        status: "active",
        country: "NG",
        city: "",
        currency: "NGN",
        calculationMode: "percentage",
        value: 2.5,
        minAmount: 0,
        maxAmount: null,
        priority: 100,
      },
      {
        id: "fee-inactive",
        name: "Service Fee",
        feeType: "service_fee",
        status: "inactive",
        country: "NG",
        city: "",
        currency: "NGN",
        calculationMode: "fixed",
        value: 500,
        minAmount: 0,
        maxAmount: null,
        priority: 120,
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === "string" ? input : input.toString();
        const method = (init?.method ?? "GET").toUpperCase();

        if (method === "GET" && url.startsWith("/api/backend/system-config/booking-pricing/tax-rules")) {
          const status = url.includes("status=active")
            ? "active"
            : url.includes("status=inactive")
              ? "inactive"
              : "all";
          const items = status === "all" ? taxRules : taxRules.filter((rule) => rule.status === status);
          return new Response(JSON.stringify({ data: { items } }), { status: 200 });
        }

        if (method === "GET" && url.startsWith("/api/backend/system-config/booking-pricing/fee-rules")) {
          const status = url.includes("status=active")
            ? "active"
            : url.includes("status=inactive")
              ? "inactive"
              : "all";
          const items = status === "all" ? feeRules : feeRules.filter((rule) => rule.status === status);
          return new Response(JSON.stringify({ data: { items } }), { status: 200 });
        }

        if (method === "POST" && url === "/api/backend/system-config/booking-pricing/tax-rules") {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { name?: string; status?: RuleStatus };
          taxRules = [
            ...taxRules,
            {
              id: "tax-new",
              name: payload.name ?? "New Tax Rule",
              status: payload.status ?? "inactive",
              country: "NG",
              city: "",
              currency: "NGN",
              calculationMode: "percentage",
              value: 5,
              isInclusive: false,
              priority: 100,
            },
          ];
          return new Response(JSON.stringify({ data: { id: "tax-new" } }), { status: 201 });
        }

        if (method === "PATCH" && url === "/api/backend/system-config/booking-pricing/tax-rules/tax-inactive") {
          taxRules = taxRules.map((rule) => (rule.id === "tax-inactive" ? { ...rule, status: "active" } : rule));
          return new Response(JSON.stringify({ data: { id: "tax-inactive" } }), { status: 200 });
        }

        if (method === "POST" && url === "/api/backend/system-config/booking-pricing/fee-rules") {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { name?: string; status?: RuleStatus };
          feeRules = [
            ...feeRules,
            {
              id: "fee-new",
              name: payload.name ?? "New Fee Rule",
              feeType: "platform_fee",
              status: payload.status ?? "inactive",
              country: "NG",
              city: "",
              currency: "NGN",
              calculationMode: "fixed",
              value: 300,
              minAmount: 0,
              maxAmount: null,
              priority: 100,
            },
          ];
          return new Response(JSON.stringify({ data: { id: "fee-new" } }), { status: 201 });
        }

        return new Response(JSON.stringify({ message: "Unhandled request in test" }), { status: 500 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads initial tax and fee rules", async () => {
    render(<BookingPricingRulesPanel role="operations" />);

    expect(await screen.findByText("Nigeria VAT")).toBeInTheDocument();
    expect(screen.getByText("Lagos City Tax")).toBeInTheDocument();
    expect(screen.getByText("Platform Fee")).toBeInTheDocument();
    expect(screen.getByText("Service Fee")).toBeInTheDocument();
  });

  it("creates a tax rule and refreshes the list", async () => {
    render(<BookingPricingRulesPanel role="operations" />);
    await screen.findByText("Nigeria VAT");

    const taxNameInput = screen.getByPlaceholderText("Name (e.g., VAT 7.5%)");
    fireEvent.change(taxNameInput, { target: { value: "Federal Tax Draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Tax Rule" }));

    await waitFor(() => {
      expect(screen.getByText("Tax rule created.")).toBeInTheDocument();
    });
    expect(screen.getByText("Federal Tax Draft")).toBeInTheDocument();
  });

  it("activates an inactive tax rule", async () => {
    render(<BookingPricingRulesPanel role="operations" />);
    await screen.findByText("Lagos City Tax");

    fireEvent.click(screen.getAllByRole("button", { name: "Activate" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Rule marked active.")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Lagos City Tax/).length).toBeGreaterThan(0);
  });

  it("filters to active rules only", async () => {
    render(<BookingPricingRulesPanel role="operations" />);
    await screen.findByText("Nigeria VAT");

    fireEvent.click(screen.getByRole("button", { name: "Active" }));

    await waitFor(() => {
      expect(screen.queryByText("Lagos City Tax")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Service Fee")).not.toBeInTheDocument();
    expect(screen.getByText("Nigeria VAT")).toBeInTheDocument();
    expect(screen.getByText("Platform Fee")).toBeInTheDocument();
  });

  it("creates a fee rule and refreshes the list", async () => {
    render(<BookingPricingRulesPanel role="operations" />);
    await screen.findByText("Platform Fee");

    const feeNameInput = screen.getByPlaceholderText("Name (e.g., Platform Service Fee 2%)");
    fireEvent.change(feeNameInput, { target: { value: "Gateway Fee Draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Fee Rule" }));

    await waitFor(() => {
      expect(screen.getByText("Fee rule created.")).toBeInTheDocument();
    });
    expect(screen.getByText("Gateway Fee Draft")).toBeInTheDocument();
  });
});
