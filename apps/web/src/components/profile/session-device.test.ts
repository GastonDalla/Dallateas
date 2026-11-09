import { describe, expect, test } from "bun:test";

import { describeDevice } from "./session-device";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const EDGE_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const FIREFOX_LINUX = "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0";

describe("describeDevice", () => {
  test("names the browser and the system", () => {
    expect(describeDevice(CHROME_MAC)).toEqual({ label: "Chrome en macOS", mobile: false });
    expect(describeDevice(FIREFOX_LINUX)).toEqual({ label: "Firefox en Linux", mobile: false });
  });

  test("does not mistake Edge for Chrome", () => {
    expect(describeDevice(EDGE_WINDOWS)).toEqual({ label: "Edge en Windows", mobile: false });
  });

  test("does not mistake a phone for its desktop relative", () => {
    expect(describeDevice(SAFARI_IPHONE)).toEqual({ label: "Safari en iOS", mobile: true });
    expect(describeDevice(CHROME_ANDROID)).toEqual({ label: "Chrome en Android", mobile: true });
  });

  test("says so when there is nothing to read", () => {
    expect(describeDevice(null)).toEqual({ label: "Dispositivo desconocido", mobile: false });
    expect(describeDevice("curl/8.0")).toEqual({ label: "Navegador desconocido", mobile: false });
  });
});
