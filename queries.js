const { Pool } = require('pg')
const { config } = require('./config');
const bcrypt = require('bcrypt')
const pool = new Pool({
  // user: 'euxghtxqpsxdlg',
  // host: 'ec2-52-87-135-240.compute-1.amazonaws.com',
  // database: 'dclhrr8rmhd8v4',
  // port: 5432,
  // password: 'e438ef711916fdf7eccd86260853f8b8ec7a64f5ed09d4bb1b2504cdc572a8ae',
  ssl: true,
  connectionString: process.env.DATABASE_URL,
})

const getUsers = (request, response) => {
  const { username, password, authorizedrequest } = request.headers;
  // console.log(username, password)
  if(authorizedrequest === 'true') {
    pool.query('SELECT username FROM weatherapp ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    })
  }
  if (!username && !password && !authorizedrequest) {
    pool.query('SELECT * FROM weatherapp ORDER BY id ASC', (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows)
    })
  } else if (username && password) {
      pool.query('SELECT * FROM weatherapp WHERE username = $1', [username], (error, results) => {
        if (error) {
          throw error
        }
        // results.rowCount===1 ? console.log(results.rows[0].id): null;
        results.rowCount===1 ?
          // console.log(results.rows[0].username, results.rows[0].password)
          // hashedPassword = results.rows[0].password;
          // currentId = results.rows[0].id;
          // currentState = results.rows[0].state;
          bcrypt.compare(password, results.rows[0].password, function(err, result) {
            result ?
              response.status(200).json({ isLoggedIn: true, id: results.rows[0].id, state: results.rows[0].state })
            :
              response.status(200).json({ isLoggedIn: false })
          })
        :
        response.status(200).json({ isLoggedIn: false })
      })
      }
}

const createUser = (request, response) => {
  const { username, password, state } = request.body
  bcrypt.hash(password, 12, function(err, hash) {
    pool.query(`INSERT INTO weatherapp (username, password, state) VALUES ($1, $2, $3) RETURNING id`, [username, hash, state], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).json({response: `User added with ID: ${results.rows[0].id}`})
    })
  })
}

const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { username, password, cities, state } = request.body
  // username = $1, password = $2, cities = $3, 
  // username, password, cities, 
  pool.query(
    'UPDATE weatherapp SET state = $1 WHERE id = $2',
    [state, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json({response: `User modified with ID: ${id}`})
    }
  )
}

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json({response: `User deleted with ID: ${id}`})
  })
}


module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
}