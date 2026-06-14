import { describe, expect, it } from "vitest";
import { buildMetingUrl, computeNextIndex, formatTime, parseLRC } from "./manager";
import type { MetingConfig } from "../../types/config";

describe("parseLRC", () => {
  it("解析标准 LRC 行", () => {
    const lrc = "[00:01.23]第一行\n[00:05.67]第二行\n";
    expect(parseLRC(lrc)).toEqual([
      { time: 1.23, text: "第一行" },
      { time: 5.67, text: "第二行" },
    ]);
  });

  it("支持毫秒三位精度", () => {
    const lrc = "[01:02.345]test";
    expect(parseLRC(lrc)).toEqual([{ time: 62.345, text: "test" }]);
  });

  it("一行多时间戳都生成", () => {
    const lrc = "[00:01.00][00:03.00]重复";
    expect(parseLRC(lrc)).toEqual([
      { time: 1, text: "重复" },
      { time: 3, text: "重复" },
    ]);
  });

  it("空字符串返回空数组", () => {
    expect(parseLRC("")).toEqual([]);
  });

  it("跳过无文本行(纯元数据)", () => {
    const lrc = "[ti:标题]\n[00:01.00]实际歌词";
    expect(parseLRC(lrc)).toEqual([{ time: 1, text: "实际歌词" }]);
  });

  it("结果按时间排序", () => {
    const lrc = "[00:05.00]b\n[00:01.00]a";
    expect(parseLRC(lrc).map((l) => l.text)).toEqual(["a", "b"]);
  });
});

describe("formatTime", () => {
  it("正常格式化", () => {
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(599)).toBe("9:59");
  });

  it("NaN 或负数返回 0:00", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(-1)).toBe("0:00");
  });
});

describe("computeNextIndex", () => {
  it("list 模式循环", () => {
    expect(computeNextIndex(0, 3, "list")).toBe(1);
    expect(computeNextIndex(2, 3, "list")).toBe(0);
  });

  it("one 模式保持当前", () => {
    expect(computeNextIndex(1, 3, "one")).toBe(1);
  });

  it("random 模式返回有效索引且不等于当前(len>1)", () => {
    const next = computeNextIndex(0, 3, "random");
    expect(next).toBeGreaterThanOrEqual(0);
    expect(next).toBeLessThan(3);
    expect(next).not.toBe(0);
  });

  it("空列表返回 -1", () => {
    expect(computeNextIndex(0, 0, "list")).toBe(-1);
  });

  it("random 单首列表返回 0", () => {
    expect(computeNextIndex(0, 1, "random")).toBe(0);
  });
});

describe("buildMetingUrl", () => {
  const baseConfig: MetingConfig = {
    api: "https://api.example.com/meting/?server=:server&type=:type&id=:id&r=:r",
    server: "netease",
    type: "playlist",
    id: "10046455237",
  };

  it("替换 :server/:type/:id 为配置值", () => {
    const url = buildMetingUrl(baseConfig.api, baseConfig);
    expect(url).toContain("server=netease");
    expect(url).toContain("type=playlist");
    expect(url).toContain("id=10046455237");
  });

  it("用数字替换 :r(结果不再含 :r)", () => {
    const url = buildMetingUrl(baseConfig.api, baseConfig);
    expect(url).not.toContain(":r");
    // :r 被替换为 Math.random() 的字符串形式(数字,含 .)
    const rMatch = url.match(/[?&]r=(0\.\d+)/);
    expect(rMatch).not.toBeNull();
  });

  it("配置 auth 时追加鉴权参数(URL 已含 ? 用 &)", () => {
    const url = buildMetingUrl(baseConfig.api, { ...baseConfig, auth: "tok123" });
    expect(url).toContain("&auth=tok123");
  });

  it("配置 auth 且 URL 无 ? 时用 ? 追加", () => {
    const noQueryApi = "https://api.example.com/meting/:server/:type/:id";
    const url = buildMetingUrl(noQueryApi, { ...baseConfig, auth: "tok123" });
    expect(url).toContain("?auth=tok123");
    expect(url).not.toContain("&auth=tok123");
  });

  it("未配置 auth 时不追加鉴权参数", () => {
    const url = buildMetingUrl(baseConfig.api, baseConfig);
    expect(url).not.toContain("auth=");
  });
});
