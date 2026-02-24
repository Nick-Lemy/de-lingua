import withPWAPlugin from "next-pwa";

const withPWA = withPWAPlugin({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  /* config options here */
  turbopack: {},
};

module.exports = withPWA(nextConfig);
