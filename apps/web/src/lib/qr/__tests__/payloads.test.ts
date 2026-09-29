import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { en } from "@/lib/i18n/dictionaries/en";
import { contentPayload, defaultContent, qrPayload, validateContent } from "../types";
import { escapeWifi } from "../types/wifi";
import { escapeVCard } from "../types/vcard";

describe("payload generators", () => {
  test("URL", () => {
    assert.equal(contentPayload({ type: "url", url: "  https://example.com/a?b=c  " }), "https://example.com/a?b=c");
  });

  test("Wi-Fi: standard fields and escaping", () => {
    assert.equal(
      contentPayload({ type: "wifi", ssid: "MyNetwork", security: "WPA", password: "MyPassword", hidden: false }),
      "WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;",
    );
    assert.equal(
      contentPayload({ type: "wifi", ssid: 'Café;"Guest":1', security: "WPA3", password: "p\\a,s;s", hidden: true }),
      'WIFI:T:SAE;S:Café\\;\\"Guest\\"\\:1;P:p\\\\a\\,s\\;s;H:true;;',
    );
    assert.equal(contentPayload({ type: "wifi", ssid: "Open", security: "nopass", password: "ignored", hidden: false }), "WIFI:T:nopass;S:Open;H:false;;");
    assert.equal(contentPayload({ type: "wifi", ssid: "Old", security: "WEP", password: "abcde", hidden: false }), "WIFI:T:WEP;S:Old;P:abcde;H:false;;");
    assert.equal(escapeWifi('\\;,:"'), '\\\\\\;\\,\\:\\"');
  });

  test("vCard 3.0 with escaping and only filled fields", () => {
    const payload = contentPayload({
      ...defaultContent("vcard"),
      firstName: "Ada",
      lastName: "Lovelace",
      organization: "Engines, Ltd; R&D",
      jobTitle: "Analyst",
      phone: "+44 (20) 7946-0000",
      email: "ada@example.com",
      website: "https://ada.example",
      street: "12 Main St",
      city: "London",
      postalCode: "N1 9GU",
      country: "UK",
    });
    assert.equal(
      payload,
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Lovelace;Ada;;;",
        "FN:Ada Lovelace",
        "ORG:Engines\\, Ltd\\; R&D",
        "TITLE:Analyst",
        "TEL;TYPE=CELL:+442079460000",
        "EMAIL:ada@example.com",
        "URL:https://ada.example",
        "ADR;TYPE=WORK:;;12 Main St;London;;N1 9GU;UK",
        "END:VCARD",
      ].join("\r\n"),
    );
    const orgOnly = contentPayload({ ...defaultContent("vcard"), organization: "Qdot" });
    assert.match(orgOnly, /\r\nFN:Qdot\r\n/);
    assert.doesNotMatch(orgOnly, /TEL|EMAIL|ADR/);
    assert.equal(escapeVCard("a\\b\nc"), "a\\\\b\\nc");
  });

  test("email: mailto with encoded subject and body", () => {
    assert.equal(contentPayload({ type: "email", to: "hello@example.com", subject: "", body: "" }), "mailto:hello@example.com");
    assert.equal(
      contentPayload({ type: "email", to: "hello@example.com", subject: "Hi & bye?", body: "Line 1\nLine 2 é" }),
      "mailto:hello@example.com?subject=Hi%20%26%20bye%3F&body=Line%201%0D%0ALine%202%20%C3%A9",
    );
  });

  test("SMS and phone normalize numbers", () => {
    assert.equal(contentPayload({ type: "sms", phone: "+33 6 12-34 (56) 78", message: "Table 4 🍷" }), "SMSTO:+33612345678:Table 4 🍷");
    assert.equal(contentPayload({ type: "phone", phone: "+33 6 12 34 56 78" }), "tel:+33612345678");
  });

  test("dynamic codes encode the short link, static codes their content", () => {
    const content = { type: "url" as const, url: "https://example.com" };
    assert.equal(qrPayload({ mode: "dynamic", shortUrl: "https://qr.tom-leclercq.fr/r/abcd2345", content }), "https://qr.tom-leclercq.fr/r/abcd2345");
    assert.equal(qrPayload({ mode: "static", shortUrl: "https://qr.tom-leclercq.fr/r/abcd2345", content }), "https://example.com");
  });
});

describe("content validation", () => {
  test("messages per field", () => {
    assert.deepEqual(validateContent({ type: "url", url: "" }, en), { url: en.editor.contentTypes.url.required });
    assert.deepEqual(validateContent({ type: "url", url: "ftp://x.test" }, en), { url: en.editor.contentTypes.url.http });
    assert.deepEqual(validateContent({ type: "wifi", ssid: "a", security: "WPA", password: "short", hidden: false }, en), {
      password: en.editor.contentTypes.wifi.passwordLength,
    });
    assert.deepEqual(validateContent({ type: "wifi", ssid: "x".repeat(33), security: "nopass", password: "", hidden: false }, en), {
      ssid: en.editor.contentTypes.wifi.ssidTooLong,
    });
    assert.ok(validateContent(defaultContent("vcard"), en).firstName);
    assert.ok(validateContent({ type: "email", to: "nope", subject: "", body: "" }, en).to);
    assert.deepEqual(validateContent({ type: "phone", phone: "+33 6 12 34 56 78" }, en), {});
  });
});
