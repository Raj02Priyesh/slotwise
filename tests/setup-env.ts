import 'dotenv/config'

// Integration tests use TEST_DATABASE_URL when set, so they never touch the development database.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
