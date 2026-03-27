// test/kwtsms-api.test.ts
// Integration tests hitting real kwtSMS API with test=1.
// Requires env vars: KWTSMS_USERNAME, KWTSMS_PASSWORD
// Related: src/services/kwtsms-api.ts

import { login, fetchSenderIds, fetchCoverage, send, validate } from "../src/services/kwtsms-api";

const USERNAME = process.env.KWTSMS_USERNAME || "";
const PASSWORD = process.env.KWTSMS_PASSWORD || "";

const describeIfCreds = USERNAME && PASSWORD ? describe : describe.skip;

describeIfCreds("kwtSMS API (real, test mode)", () => {
  it("login returns balance", async () => {
    const result = await login(USERNAME, PASSWORD);
    expect(result.result).toBe("OK");
    expect(typeof result.available).toBe("number");
    expect(typeof result.purchased).toBe("number");
  });

  it("login with wrong password throws ERR003", async () => {
    await expect(login(USERNAME, "wrongpassword")).rejects.toThrow("ERR003");
  });

  it("fetchSenderIds returns array", async () => {
    const ids = await fetchSenderIds(USERNAME, PASSWORD);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("fetchCoverage returns array of prefixes", async () => {
    const coverage = await fetchCoverage(USERNAME, PASSWORD);
    expect(Array.isArray(coverage)).toBe(true);
    expect(coverage.length).toBeGreaterThan(0);
    expect(coverage).toContain("965");
  });

  it("send with test=1 returns OK", async () => {
    const result = await send(USERNAME, PASSWORD, "KWT-SMS", "96598765432", "Test message from kwtSMS Excel add-in", 1);
    expect(result.result).toBe("OK");
    expect(result["msg-id"]).toBeDefined();
    expect(typeof result["points-charged"]).toBe("number");
    expect(typeof result["balance-after"]).toBe("number");
  });

  it("validate returns phone categories", async () => {
    const result = await validate(USERNAME, PASSWORD, "96598765432");
    expect(result.result).toBe("OK");
    expect(result.mobile).toBeDefined();
  });
});
