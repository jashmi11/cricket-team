const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()

app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertPlayerObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players', async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`
  const getPlayers = await db.all(getPlayersQuery)
  response.send(getPlayers.map(eachPlayer => convertPlayerObject(eachPlayer)))
})

app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`
  const getPlayer = await db.get(getPlayerQuery)
  response.send(convertPlayerObject(getPlayer))
})

app.put('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const getPlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId}`
  await db.run(getPlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const getPlayerQuery = `SELECT * FROM match_details WHERE match_id = ${matchId}`
  const getPlayer = await db.get(getPlayerQuery)
  response.send(convertMatchObject(getPlayer))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchQuer = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId}`
  const resp = await db.all(getMatchQuer)
  response.send(resp.map(eachObj => convertMatchObject(eachObj)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuer = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id = ${matchId}`
  const resp = await db.all(getMatchQuer)
  response.send(resp.map(eachObj => convertPlayerObject(eachObj)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const resp = await db.all(getPlayerScored)
  response.send(resp)
})

module.exports = app
