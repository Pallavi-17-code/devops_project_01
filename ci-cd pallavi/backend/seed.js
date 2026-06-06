const db = require('./config/db');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // 1. Create Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pipelines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'idle',
        last_run TIMESTAMP,
        repository_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Add Sample Pipelines
    const pipelines = [
      ['Frontend Deployment', 'https://github.com/user/frontend-app', 'success'],
      ['Backend API Build', 'https://github.com/user/backend-api', 'idle'],
      ['Database Migration', 'https://github.com/user/db-repo', 'failed']
    ];

    for (const [name, url, status] of pipelines) {
      await db.query(
        'INSERT INTO pipelines (name, repository_url, status) VALUES ($1, $2, $3)',
        [name, url, status]
      );
    }

    console.log('✅ Database seeded with sample pipelines!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
