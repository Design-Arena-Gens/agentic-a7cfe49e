import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "imapflow",
    "nodemailer",
    "pino",
    "thread-stream",
    "why-is-node-running",
    "tap",
  ],
};

export default nextConfig;
