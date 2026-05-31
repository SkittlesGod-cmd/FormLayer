/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://formlayer.co",
  generateRobotsTxt: true,
  exclude: [
    "/admin",
    "/admin/*",
    "/auth/callback",
    "/dashboard",
    "/dashboard/*",
    "/f/*",
    "/forgot-password",
    "/get-access",
    "/get-access/*",
    "/profile",
    "/reset-password",
    "/sign-in",
    "/sign-up",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/auth/callback",
          "/dashboard",
          "/f",
          "/forgot-password",
          "/get-access",
          "/profile",
          "/reset-password",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
  },
};
