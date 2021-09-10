create a pass.js file that looks like this:

const dbUrl = 'mongokeyurl'
const recaptchaKey = 'sitekey'
const serverCaptchaKey = 'serverkey'
module.exports = {
    dbUrl: dbUrl,
    recaptchaKey: recaptchaKey,
    serverCaptchaKey: serverCaptchaKey,
}