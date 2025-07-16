import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
        loader: 'custom',
        loaderFile: './image-loader.js',
      }
};

export default nextConfig;
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // compiler:{
  //   removeConsole: process.env.NODE_ENV === "production"
  // }
  // compiler:{
  //   removeConsole: true
  // }
};
