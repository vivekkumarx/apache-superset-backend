import express from 'express'
import fetch from 'node-fetch'
import * as dotenv from 'dotenv'

dotenv.config()

const PORT = 5000
const SUPERSET_DASHBOARD_ID = process.env.SUPERSET_DASHBOARD_ID
const SUPERSET_DASHBOARD_URL = process.env.SUPERSET_DASHBOARD_URL
const ADMIN_USER_USERNAME = process.env.ADMIN_USER_USERNAME
const ADMIN_USER_PASSWORD = process.env.ADMIN_USER_PASSWORD
const GUEST_USER_USERNAME = process.env.GUEST_USER_USERNAME
const GUEST_USER_FIRST_NAME = process.env.GUEST_USER_FIRST_NAME
const GUEST_USER_LAST_NAME = process.env.GUEST_USER_LAST_NAME

const app = express()

async function fetchAccessToken() {
  try {
    const body = {
      username: ADMIN_USER_USERNAME,
      password: ADMIN_USER_PASSWORD,
      provider: 'db',
      refresh: true,
    }

    const response = await fetch(
      `${SUPERSET_DASHBOARD_URL}/api/v1/security/login`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    return data?.access_token
  } catch (error) {
    console.error(error)
  }
}

async function fetchGuestToken() {
  const accessToken = await fetchAccessToken()
  try {
    const body = {
      resources: [
        {
          type: 'dashboard',
          id: SUPERSET_DASHBOARD_ID,
        },
      ],
      rls: [],
      user: {
        username: GUEST_USER_USERNAME,
        first_name: GUEST_USER_FIRST_NAME,
        last_name: GUEST_USER_LAST_NAME,
      },
    }
    const response = await fetch(
      `${SUPERSET_DASHBOARD_URL}/api/v1/security/guest_token`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const data = await response.json()
    return data?.token
  } catch (error) {
    console.error(error)
  }
}

app.get('/', (req, res) => {
  res.send('Hello world').status(200)
})

app.get('/guest-token', async (req, res) => {
  try {
    const token = await fetchGuestToken()
    if (token) res.status(200).json(token)
    else throw new Error('Error fetching guest token')
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Some error occurred', errorMessage: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
