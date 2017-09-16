module.exports = {

  database: process.env.DATABASE || 'mongodb://localhost:27017/test',
  port: process.env.PORT || 3000,
  secret: process.env.SECRET || 'fiverclone2222',

}
