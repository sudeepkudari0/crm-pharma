import createPwaPlugin from "next-pwa";

const withPWA = createPwaPlugin({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
