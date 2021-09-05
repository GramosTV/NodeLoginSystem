const LocalStrategy = require('passport-local').Strategy
const bcrypt =require('bcrypt')
const mongodb = require('mongodb')
function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        let user = getUserByEmail(email)
        if (!user) {
            return done(null, false, { message: 'No user with this email!' })
        } 
        user.id = user._id.toString()
        if (user == null) {
            return done(null, false, { message: 'No user with this email!' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Password incorrect!' })
            }
        } catch (e) {
            console.log(e)
        }
    }
 passport.use(new LocalStrategy({ usernameField: 'email' }, 
 authenticateUser))
 passport.serializeUser((user, done) => done(null, user.id))
 passport.deserializeUser((id, done) => done(null, getUserById(id)))
}

module.exports = initialize