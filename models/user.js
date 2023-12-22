/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config")
const ExpressError = require("../expressError");

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
 
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(
      `INSERT INTO users (username, password, first_name,    last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`, [username, hashed_password, first_name, last_name, phone]
    )

    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password 
      FROM users
      WHERE username=$1`, [username]
    )

    const user = result.rows[0]

    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return user ? true : false;
      } 
    } else {
      throw new ExpressError("Invalid Username/Password", 400)
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `UPDATE users
      SET last_login_at=current_timestamp
      WHERE username=$1
      RETURNING username, last_login_at`, [username]
    )

    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users`
    )

    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users 
      WHERE username=$1`, [username]
    )
    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   
  */

  static async messagesFrom(username) { 
    const result = await db.query(
      `SELECT 
        users.first_name,
        users.last_name,
        users.phone,
        messages.id,
        messages.to_username, 
        messages.body,
        messages.sent_at,
        messages.read_at
      FROM 
        messages
      JOIN 
        users ON messages.from_username = users.username
      WHERE 
        users.username=$1`, [username]
    )
    
    
    if (!result.rows[0]) {
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return result.rows.map(m => async ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
  */

  static async messagesTo(username) { 
    const result = await db.query(
      `SELECT 
        messages.id, 
        messages.body, 
        messages.sent_at, 
        messages.read_at, 
        messages.from_username, 
        users.first_name, 
        users.last_name, 
        users.phone
      FROM 
        messages
      JOIN 
        users ON messages.to_username = users.username
      WHERE 
        users.username=$1`, [username]
    )
    
    return result.rows
  }
}


module.exports = User;