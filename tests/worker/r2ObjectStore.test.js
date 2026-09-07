import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  R2ObjectStore,
  encodeObjectPath,
  signV4,
} from "../../scripts/r2-object-store.mjs";

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map((server) => new Promise((resolve) => server.close(resolve))),
  );
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("SigV4 signing", () => {
  it("reproduces the AWS documented GET object signature", () => {
    // https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
    const headers = signV4({
      method: "GET",
      url: "https://examplebucket.s3.amazonaws.com/test.txt",
      headers: { range: "bytes=0-9" },
      payloadSha256: sha256(""),
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      region: "us-east-1",
      date: new Date("2013-05-24T00:00:00Z"),
    });
    expect(headers.authorization).toBe(
      "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
    );
  });

  it("encodes object keys per path segment", () => {
    expect(encodeObjectPath("bucket", "assets/sha256/ab cd*(1)")).toBe(
      "/bucket/assets/sha256/ab%20cd%2A%281%29",
    );
  });
});

async function fakeR2(handler) {
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    requests.push({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body,
    });
    await handler(request, response, body, requests.length);
  });
  servers.push(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    requests,
    endpoint: `http://127.0.0.1:${server.address().port}`,
  };
}

function store(endpoint, overrides = {}) {
  return new R2ObjectStore({
    bucket: "artifacts",
    endpoint,
    accessKeyId: "a".repeat(24),
    secretAccessKey: "b".repeat(40),
    attempts: 3,
    allowInsecureEndpoint: true,
    ...overrides,
  });
}

describe("R2ObjectStore", () => {
  it("issues a signed conditional PUT and a GET on one connection pool", async () => {
    const objects = new Map();
    const fake = await fakeR2((request, response, body) => {
      const key = decodeURIComponent(request.url.replace("/artifacts/", ""));
      if (request.method === "PUT") {
        if (objects.has(key)) {
          response.writeHead(412);
          response.end("<Error><Code>PreconditionFailed</Code></Error>");
          return;
        }
        objects.set(key, body);
        response.writeHead(200);
        response.end();
        return;
      }
      const bytes = objects.get(key);
      response.writeHead(bytes ? 200 : 404);
      response.end(bytes);
    });
    const client = store(fake.endpoint);
    const payload = Buffer.from("immutable asset");
    const key = `assets/sha256/${sha256(payload)}`;
    try {
      await client.putIfAbsent(key, null, payload);
      await expect(client.get(key)).resolves.toEqual(payload);
      await expect(
        client.putIfAbsent(key, null, payload),
      ).rejects.toMatchObject({
        status: 412,
        code: "PreconditionFailed",
        retryable: false,
      });
    } finally {
      await client.close();
    }
    const [put, get] = fake.requests;
    expect(put.headers["if-none-match"]).toBe("*");
    expect(put.headers["x-amz-content-sha256"]).toBe(sha256(payload));
    expect(put.headers.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=a{24}\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=host;if-none-match;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    expect(get.method).toBe("GET");
    expect(get.headers.authorization).toContain(
      "SignedHeaders=host;x-amz-content-sha256;x-amz-date",
    );
    expect(fake.requests).toHaveLength(3);
  });

  it("retries transient failures but not precondition or client errors", async () => {
    let attempts = 0;
    const fake = await fakeR2((request, response) => {
      attempts += 1;
      if (attempts === 1) {
        response.writeHead(503);
        response.end("<Error><Code>SlowDown</Code></Error>");
        return;
      }
      response.writeHead(200);
      response.end("ok");
    });
    const client = store(fake.endpoint);
    try {
      await expect(client.get("assets/sha256/x")).resolves.toEqual(
        Buffer.from("ok"),
      );
      expect(attempts).toBe(2);
    } finally {
      await client.close();
    }

    const denied = await fakeR2((request, response) => {
      response.writeHead(403);
      response.end("<Error><Code>AccessDenied</Code></Error>");
    });
    const deniedClient = store(denied.endpoint);
    try {
      await expect(deniedClient.get("assets/sha256/x")).rejects.toMatchObject({
        status: 403,
        code: "AccessDenied",
        retryable: false,
      });
      expect(denied.requests).toHaveLength(1);
    } finally {
      await deniedClient.close();
    }
  });

  it("requires an https origin endpoint outside tests", () => {
    expect(
      () =>
        new R2ObjectStore({
          bucket: "artifacts",
          endpoint: "http://account.r2.cloudflarestorage.com",
          accessKeyId: "a",
          secretAccessKey: "b",
        }),
    ).toThrow("https origin");
    expect(
      () =>
        new R2ObjectStore({
          bucket: "artifacts",
          endpoint: "https://account.r2.cloudflarestorage.com/bucket",
          accessKeyId: "a",
          secretAccessKey: "b",
        }),
    ).toThrow("https origin");
  });
});
