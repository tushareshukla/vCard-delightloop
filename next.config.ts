import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
        loader: 'custom',
        loaderFile: './image-loader.js',
      }
};

export default nextConfig;
