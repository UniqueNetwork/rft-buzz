const config = {
  port : process.env.port || 3001,
  ss58prefix : 255,
  // ss58prefix : 7391,

  dbHost : process.env.DB_HOST || 'localhost',
  dbPort : process.env.DB_PORT || 5432,
  dbName : process.env.DB_NAME|| 'rft_buzz_db',
  dbUser : process.env.DB_USER || 'rft',
  dbPassword : process.env.DB_PASSWORD || '12345'
};

module.exports = config;
