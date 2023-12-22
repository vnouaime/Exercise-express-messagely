const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")
const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config")
const jwt = require("jsonwebtoken")
const User = require("../models/user")



/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
**/

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            throw new ExpressError("Username and password required", 400)
        }

        const login = await User.authenticate(username, password)

        if (login) {
            const _token = jwt.sign({ username }, SECRET_KEY)

            await User.updateLoginTimestamp(username)
            
            return res.json({message: "Logged In!", _token})
        }
    } catch (e) {
        return next(e)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
*/

router.post("/register", async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body

        if (!username || !password || !first_name, !last_name || !phone) {
            throw new ExpressError("Missing Data", 400)
        }
        
        const newUser = await User.register({username, password, first_name, last_name, phone})

        const token = jwt.sign({ username }, SECRET_KEY)

        return res.status(201).json({message: `Welcome ${username}!`, token})

    } catch (e) {
        if (e.code === '23505') {
            return next(new ExpressError("Username taken. Please pick another!", 400))
        } else {
            return next(e)
        }
    }
})

module.exports = router;