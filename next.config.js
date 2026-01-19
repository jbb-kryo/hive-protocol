/** @type {import('next').NextConfig} */

function validateEnvAtBuild() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = requiredEnvVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `\n\nMissing required environment variables:\n` +
      missing.map((key) => `  - ${key}`).join('\n') +
      `\n\nPlease check your .env file and ensure all required variables are set.\n` +
      `See .env.example for the required format.\n`
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && supabaseUrl.includes('placeholder')) {
    throw new Error(
      '\n\nNEXT_PUBLIC_SUPABASE_URL contains a placeholder value.\n' +
      'Please set a valid Supabase project URL.\n'
    )
  }

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseKey && supabaseKey.includes('placeholder')) {
    throw new Error(
      '\n\nNEXT_PUBLIC_SUPABASE_ANON_KEY contains a placeholder value.\n' +
      'Please set a valid Supabase anon key.\n'
    )
  }
}

if (process.env.NODE_ENV === 'production') {
  validateEnvAtBuild()
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;
