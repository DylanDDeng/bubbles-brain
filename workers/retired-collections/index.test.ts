import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectionDirectories } from "../../astro/src/lib/collectionRoutes";
import worker from "./index";

afterEach(() => vi.unstubAllGlobals());

describe("retired collection responses", () => {
  it("returns an uncached 404 without consulting a stale origin", async () => {
    const upstream = vi.fn(() => new Response("stale directory"));
    vi.stubGlobal("fetch", upstream);
    for (const path of [...Object.keys(collectionDirectories), "/highlights/2025/"]) {
      for (const suffix of ["", "?page=2"]) {
        const response = await worker.fetch(new Request(`https://bubblenews.today${path}${suffix}`));
        expect(response.status).toBe(404);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("location")).toBeNull();
        expect(await response.text()).not.toContain("stale directory");
      }
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  it("preserves HEAD semantics and leaves details and English routes alone", async () => {
    const head = await worker.fetch(new Request("https://bubblenews.today/workbuddy-tutorials/", { method: "HEAD" }));
    expect(head.status).toBe(404);
    expect(await head.text()).toBe("");
    const upstream = vi.fn(() => new Response("article", { status: 200 }));
    vi.stubGlobal("fetch", upstream);
    for (const path of ["/", "/workbuddy-tutorials/workbuddy-feishu-workflow-guide/", "/benchmarks/aa-index/", "/en/newbie-tutorials/"]) {
      const request = new Request(`https://bubblenews.today${path}`);
      expect(await (await worker.fetch(request)).text()).toBe("article");
      expect(upstream).toHaveBeenLastCalledWith(request);
    }
  });

  it("deploys only the exact directories and retired year archive, without article wildcards", () => {
    const config = readFileSync("workers/retired-collections/wrangler.toml", "utf8");
    const paths = [...config.matchAll(/pattern = "bubblenews\.today([^"]+)"/g)].map(match => match[1]);
    expect(paths.sort()).toEqual([...Object.keys(collectionDirectories), "/highlights/2025/"].sort());
    expect(paths.every(path => !path.includes("*"))).toBe(true);
  });
});
