const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")
const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR } = require("../config")
const Message = require("../models/message")
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
**/

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params
        const { username } = req.user
        const message = await Message.get(id)

        if (message.to_user.username !== username && message.from_user.username !== username) {
            throw new ExpressError("Cannot read this message", 401);
        }

        return res.json({message})
    } catch (e) {
        return next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
**/

router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const { to_username, body } = req.body

        if (!to_username || !body) {
            throw new ExpressError("Missing Data", 400)
        }

        const message = await Message.create({
            "from_username": req.user.username, 
            to_username, 
            body
        })

        return res.status(201).json({message})
    } catch (e) {
        next(e)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
**/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const { id } = req.params
        const { username }  = req.user
        const message = await Message.get(id)

        if (message.to_user.username !== username) {
            throw new ExpressError("Cannot set message to read.", 401)
        }

        const readMessage =  await Message.markRead(id)

        return res.json({message: readMessage})

    } catch (e) {
        return next(e)
    }
})

module.exports = router;