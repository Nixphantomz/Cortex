/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // These are optional peer deps pulled in by wagmi/RainbowKit's connector
    // libraries for use cases we don't need (React Native apps, pretty
    // terminal logging). Telling webpack not to resolve them just silences
    // the noisy "module not found" warnings — nothing is actually broken.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

module.exports = nextConfig;