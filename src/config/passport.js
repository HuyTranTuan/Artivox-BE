const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { prisma } = require("@libs/prisma");
const slugify = require("@/utils/slugify");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3600/api/v1/auth/customer/google/callback";

passport.use(
  "google-customer",
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), null);

        const normalizedEmail = email.trim().toLowerCase();
        const avatar = profile.photos?.[0]?.value || null;
        const fullName = profile.displayName || normalizedEmail.split("@")[0];

        let customer = await prisma.customer.findFirst({
          where: { email: normalizedEmail, deletedAt: null },
        });

        if (!customer) {
          const slug = slugify(fullName) + "-" + Date.now().toString(36);
          customer = await prisma.customer.create({
            data: {
              email: normalizedEmail,
              password: "",
              fullName,
              slug,
              avatar,
              // Already verified via Google
              verifiedAt: new Date(),
            },
          });
        } else if (!customer.verifiedAt) {
          // Mark verified if previously registered without Google
          await prisma.customer.update({
            where: { id: customer.id },
            data: { verifiedAt: new Date(), ...(avatar && !customer.avatar ? { avatar } : {}) },
          });
          customer = { ...customer, verifiedAt: new Date() };
        }

        return done(null, customer);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
