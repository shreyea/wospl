import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* React Compiler disabled — incompatible with Framer Motion */
  reactCompiler: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mtrirwxgqxngdqukrata.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
