import { createHash, createHmac } from "node:crypto";
import { Agent, fetch as undiciFetch } from "undici";

const EMPTY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_ATTEMPTS = 4;

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function encodeObjectPath(bucket, key) {
  return `/${[bucket, ...key.split("/")].map(encodeSegment).join("/")}`;
}

export function amzDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function signV4({
  method,
  url,
  headers,
  payloadSha256,
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region = "auto",
  service = "s3",
  date = new Date(),
}) {
  const target = new URL(url);
  const timestamp = amzDate(date);
  const scopeDate = timestamp.slice(0, 8);
  const signed = new Map(
    Object.entries(headers).map(([name, value]) => [
      name.toLowerCase(),
      String(value).trim().replace(/\s+/g, " "),
    ]),
  );
  signed.set("host", target.host);
  signed.set("x-amz-date", timestamp);
  signed.set("x-amz-content-sha256", payloadSha256);
  if (sessionToken) signed.set("x-amz-security-token", sessionToken);
  const names = [...signed.keys()].sort();
  const canonicalHeaders = names
    .map((name) => `${name}:${signed.get(name)}\n`)
    .join("");
  const signedHeaders = names.join(";");
  const canonicalQuery = [...target.searchParams.entries()]
    .map(([name, value]) => [encodeSegment(name), encodeSegment(value)])
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  const canonicalRequest = [
    method,
    target.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadSha256,
  ].join("\n");
  const scope = `${scopeDate}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    timestamp,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, scopeDate), region), service),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");
  const output = Object.fromEntries(
    names
      .filter((name) => name !== "host")
      .map((name) => [name, signed.get(name)]),
  );
  output.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return output;
}

export class R2RequestError extends Error {
  constructor(message, { status, code, retryable }) {
    super(message);
    this.name = "R2RequestError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

function errorCode(body) {
  return body.match(/<Code>([^<]+)<\/Code>/)?.[1] || null;
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds),
  );
}

/**
 * Minimal S3-compatible client for Cloudflare R2 that keeps one HTTP/1.1
 * connection pool open for the whole run instead of spawning the AWS CLI for
 * every object. It preserves the workflow's immutability contract: PUTs are
 * conditional on `If-None-Match: *` and callers still GET-verify every object.
 */
export class R2ObjectStore {
  constructor({
    bucket,
    endpoint,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken = process.env.AWS_SESSION_TOKEN,
    region = process.env.AWS_DEFAULT_REGION || "auto",
    connections = 32,
    attempts = DEFAULT_ATTEMPTS,
    fetch = undiciFetch,
    dispatcher,
    now = () => new Date(),
    allowInsecureEndpoint = false,
  }) {
    if (!bucket || !endpoint) {
      throw new Error("R2 bucket and endpoint are required");
    }
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("R2 access key id and secret access key are required");
    }
    const origin = new URL(endpoint);
    if (
      (origin.protocol !== "https:" && !allowInsecureEndpoint) ||
      origin.pathname !== "/" ||
      origin.search
    ) {
      throw new Error("R2 endpoint must be an https origin");
    }
    this.bucket = bucket;
    this.origin = origin.origin;
    this.credentials = { accessKeyId, secretAccessKey, sessionToken, region };
    this.attempts = attempts;
    this.fetch = fetch;
    this.now = now;
    this.dispatcher =
      dispatcher ||
      new Agent({ connections, pipelining: 1, keepAliveTimeout: 30_000 });
  }

  async request(method, key, { body, headers = {} } = {}) {
    const url = `${this.origin}${encodeObjectPath(this.bucket, key)}`;
    const payloadSha256 = body ? sha256Hex(body) : EMPTY_SHA256;
    let lastError;
    for (let attempt = 1; attempt <= this.attempts; attempt += 1) {
      const signedHeaders = signV4({
        method,
        url,
        headers,
        payloadSha256,
        date: this.now(),
        ...this.credentials,
      });
      let response;
      try {
        response = await this.fetch(url, {
          method,
          headers: signedHeaders,
          body,
          dispatcher: this.dispatcher,
        });
      } catch (error) {
        lastError = new R2RequestError(
          `R2 ${method} ${key} failed: ${error instanceof Error ? error.message : String(error)}`,
          { status: 0, code: null, retryable: true },
        );
        if (attempt < this.attempts) {
          await sleep(200 * 2 ** (attempt - 1));
          continue;
        }
        throw lastError;
      }
      if (response.ok) return response;
      const text = (await response.text()).slice(0, 2048);
      const retryable = RETRYABLE_STATUSES.has(response.status);
      lastError = new R2RequestError(
        `R2 ${method} ${key} failed with ${response.status}${text ? `: ${text}` : ""}`,
        { status: response.status, code: errorCode(text), retryable },
      );
      if (!retryable || attempt === this.attempts) throw lastError;
      await sleep(200 * 2 ** (attempt - 1));
    }
    throw lastError;
  }

  async putIfAbsent(key, _localPath, bytes) {
    if (!Buffer.isBuffer(bytes)) {
      throw new Error("R2 putIfAbsent requires the object bytes");
    }
    await this.request("PUT", key, {
      body: bytes,
      headers: { "if-none-match": "*" },
    });
  }

  async get(key) {
    const response = await this.request("GET", key);
    return Buffer.from(await response.arrayBuffer());
  }

  async close() {
    await this.dispatcher.close();
  }
}
