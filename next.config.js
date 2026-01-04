/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for kafkajs in Next.js
    if (isServer) {
      config.externals.push({
        'kafkajs': 'commonjs kafkajs'
      });
    }
    return config;
  },
};

module.exports = nextConfig;
