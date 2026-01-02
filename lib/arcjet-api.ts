import arcjet, { detectBot, tokenBucket } from "@arcjet/next";

export const apiAj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({ mode: "LIVE", allow: ["CATEGORY:SEARCH_ENGINE"] }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 20,
      interval: 60,
      capacity: 700,
    }),
  ],
});