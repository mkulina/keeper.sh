import { describe, expect, it } from "bun:test";
import { RateLimiter } from "./rate-limiter";

const sleep = (milliseconds: number): Promise<void> => Bun.sleep(milliseconds);

describe("RateLimiter", () => {
  describe("execute", () => {
    it("resolves with the operation result", async () => {
      const limiter = new RateLimiter();
      const result = await limiter.execute(() => Promise.resolve("hello"));
      expect(result).toBe("hello");
    });

    it("rejects when the operation throws", async () => {
      const limiter = new RateLimiter();
      const error = new Error("boom");

      await expect(limiter.execute(() => Promise.reject(error))).rejects.toThrow("boom");
    });

    it("runs operations concurrently up to the concurrency limit", async () => {
      const limiter = new RateLimiter({ concurrency: 2 });
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createTask = () =>
        limiter.execute(async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await sleep(50);
          concurrentCount--;
        });

      await Promise.all([createTask(), createTask(), createTask(), createTask()]);

      expect(maxConcurrent).toBe(2);
    });

    it("processes queued tasks after earlier tasks complete", async () => {
      const limiter = new RateLimiter({ concurrency: 1 });
      const order: number[] = [];

      const task1 = limiter.execute(async () => {
        await sleep(20);
        order.push(1);
      });

      const task2 = limiter.execute(() => {
        order.push(2);
        return Promise.resolve();
      });

      await Promise.all([task1, task2]);
      expect(order).toEqual([1, 2]);
    });
  });

  describe("rate limiting", () => {
    it("respects requestsPerMinute by delaying excess requests", async () => {
      const limiter = new RateLimiter({ concurrency: 10, requestsPerMinute: 2 });
      const timestamps: number[] = [];

      const createTask = () =>
        limiter.execute(() => {
          timestamps.push(Date.now());
          return Promise.resolve();
        });

      await Promise.all([createTask(), createTask()]);

      expect(timestamps).toHaveLength(2);
    });
  });

  describe("reportRateLimit", () => {
    it("delays subsequent requests after a rate limit is reported", async () => {
      const limiter = new RateLimiter({ concurrency: 1 });

      await limiter.execute(() => Promise.resolve("first"));

      limiter.reportRateLimit();

      const start = Date.now();
      await limiter.execute(() => Promise.resolve("second"));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(900);
    });

    it("resets backoff after a successful operation", async () => {
      const limiter = new RateLimiter({ concurrency: 1 });

      await limiter.execute(() => Promise.resolve("warmup"));
      limiter.reportRateLimit();

      await limiter.execute(() => Promise.resolve("after-backoff"));

      const start = Date.now();
      await limiter.execute(() => Promise.resolve("should-be-fast"));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it("doubles backoff on consecutive rate limits up to the maximum", async () => {
      const limiter = new RateLimiter({ concurrency: 1 });

      await limiter.execute(() => Promise.resolve("warmup"));

      limiter.reportRateLimit();
      limiter.reportRateLimit();

      const start = Date.now();
      await limiter.execute(() => Promise.resolve("after-double-backoff"));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(1900);
    });
  });
});
