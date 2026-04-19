import { getSystemConfigRecords } from "@/modules/system-config/data";
import { mockSystemConfigRepository } from "@/modules/system-config/service";

describe("system-config service", () => {
  it("publishes a draft taxonomy item and records audit metadata", async () => {
    const records = getSystemConfigRecords();
    const result = await mockSystemConfigRepository.applyAction(
      records,
      { type: "publish", itemId: "sysc-003", actor: "Amina Bello", note: "Airport parking amenity reviewed and cleared for partner use." },
      "super_admin",
    );

    expect(result.updatedRecord.status).toBe("active");
    expect(result.updatedRecord.latestAuditRecord?.action).toBe("publish");
    expect(result.updatedRecord.latestAuditRecord?.status).toBe("queued_for_backend");
    expect(result.auditRecord.summary).toContain("Airport Parking");
  });

  it("enables a disabled feature toggle and sets rollout to 100", async () => {
    const records = getSystemConfigRecords();
    const result = await mockSystemConfigRepository.applyAction(
      records,
      { type: "enable", itemId: "sysc-012", actor: "David Cole", note: "Legal review resolved. Enabling dynamic pricing for East Africa pilot." },
      "operations",
    );

    expect(result.updatedRecord.status).toBe("enabled");
    expect(result.updatedRecord.rolloutPercent).toBe(100);
  });

  it("activates a draft service area when parent city is active", async () => {
    const records = getSystemConfigRecords();
    const result = await mockSystemConfigRepository.applyAction(
      records,
      { type: "activate", itemId: "sysc-021", actor: "Amina Bello", note: "Supply team signed off. Nairobi CBD service area is ready to go live." },
      "super_admin",
    );

    expect(result.updatedRecord.status).toBe("active");
    expect(result.updatedRecord.history[0].action).toBe("Activated");
    expect(result.auditRecord.action).toBe("activate");
  });

  it("publishes a draft moderation template", async () => {
    const records = getSystemConfigRecords();
    const result = await mockSystemConfigRepository.applyAction(
      records,
      { type: "publish", itemId: "sysc-026", actor: "Amina Bello", note: "Moderation team reviewed and approved send-back template for listings." },
      "super_admin",
    );

    expect(result.updatedRecord.status).toBe("active");
    expect(result.auditRecord.summary).toContain("Listing: Send Back for Corrections");
  });

  it("publishes draft content and sets status to published (not active)", async () => {
    const records = getSystemConfigRecords();
    const result = await mockSystemConfigRepository.applyAction(
      records,
      { type: "publish", itemId: "sysc-031", actor: "Amina Bello", note: "Ops team approved maintenance announcement for partner distribution." },
      "super_admin",
    );

    expect(result.updatedRecord.status).toBe("published");
  });

  it("stages a feature toggle with a specific rollout percent", async () => {
    const records = getSystemConfigRecords();
    const result = await mockSystemConfigRepository.applyAction(
      records,
      { type: "stage", itemId: "sysc-014", actor: "David Cole", note: "Staging SMS channel at 25 percent for East Africa pilot partners.", rolloutPercent: 25 },
      "operations",
    );

    expect(result.updatedRecord.status).toBe("staged");
    expect(result.updatedRecord.rolloutPercent).toBe(25);
  });

  it("rejects publish attempt by operations for taxonomy", async () => {
    const records = getSystemConfigRecords();
    await expect(
      mockSystemConfigRepository.applyAction(
        records,
        { type: "publish", itemId: "sysc-003", actor: "David Cole", note: "Trying to publish from operations role." },
        "operations",
      ),
    ).rejects.toThrow("This action is not available for the selected item and role.");
  });

  it("rejects archiving a moderation template with active usage", async () => {
    const records = getSystemConfigRecords();
    await expect(
      mockSystemConfigRepository.applyAction(
        records,
        { type: "archive", itemId: "sysc-023", actor: "Amina Bello", note: "Attempting to archive in-use template." },
        "super_admin",
      ),
    ).rejects.toThrow("referenced by 47 active moderation workflows");
  });

  it("rejects archiving the sole published terms document", async () => {
    const records = getSystemConfigRecords();
    await expect(
      mockSystemConfigRepository.applyAction(
        records,
        { type: "archive", itemId: "sysc-028", actor: "Amina Bello", note: "Archiving terms without replacement." },
        "super_admin",
      ),
    ).rejects.toThrow("Cannot archive the only published terms or policy document.");
  });
});
