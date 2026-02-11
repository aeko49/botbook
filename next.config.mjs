/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api.seedance.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.seedance.ai',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
