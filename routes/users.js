const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")
const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config")
const User = require("../models/user")
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const users = await User.all()
        
        return res.json({users})
    } catch (e) {
        return next(new ExpressError("Please login first!", 401))
    }
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
**/

router.get('/:username', ensureCorrectUser, async (req, res, next) => {
    try {
        const user = await User.get(req.params.username)

        return res.json({user})
    } catch (e) {
        return next(new ExpressError("Unauthorized", 401))
    }
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
**/

router.get("/:username/to", ensureCorrectUser, async (req, res,next) => {
    try {
        const messages = await User.messagesTo(req.user.username)

        return res.json({
            messages: messages.map(r => ({
                "id": r.id, 
                "body": r.body, 
                "sent_at": r.sent_at, 
                "read_at": r.read_at,
                "from_user": {
                    "username": r.from_username, 
                    "first_name": r.first_name, 
                    "last_name": r.last_name,
                    "phone": r.phone
                }
            }))
        })
    } catch (e) {
        return next(e)
    }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
**/

router.get("/:username/from", ensureCorrectUser, async(req, res, next) => {
    try {
        const messages = await User.messagesFrom(req.params.username)
        
        return res.json({messages})
    } catch (e) {
        return next(e)
    }
})

module.exports = router;