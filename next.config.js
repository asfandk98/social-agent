/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // required so Docker can copy a minimal, self-contained build
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'buffer-channel-avatars-bucket.s3.amazonaws.com' },
      // add any other external image domains you load via <img>/<Image> here
    ],
  },
};

module.exports = nextConfig;
