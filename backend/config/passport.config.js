const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { sendWelcomeEmail } = require('../services/email.service');

module.exports = function(passport, prisma) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        try {
          let user = await prisma.user.findUnique({
            where: { googleId: googleId }
          });
    
          if (!user) {
            // Check if user exists with the same email
            let existingUser = await prisma.user.findUnique({
              where: { email: email }
            });
    
            if (existingUser) {
              // If user exists but without googleId, link the account
              user = await prisma.user.update({
                where: { email: email },
                data: { googleId: googleId }
              });
            } else {
              // If user does not exist at all, create a new one
              user = await prisma.user.create({
                data: {
                  email: email,
                  name: name,
                  googleId: googleId,
                }
              });
              // Send welcome email ONLY when a new user is created
              await sendWelcomeEmail(user.email, user.name);
            }
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};