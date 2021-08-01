// Start database type creation.

const { exists } = require('fs')
const { Pool, Client } = require('pg')
const { exit } = require('process')

const client = new Client({
  host: 'localhost',
  database: 'scrapper'
})


client.connect()

client.query('CREATE TABLE IF NOT EXISTS city (id serial PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL)', (err, res) => {
  console.log(res)
})


client.query('CREATE TABLE IF NOT EXISTS category (id serial PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL)', (err, res) => {
  console.log(err, res)
})


var query = "CREATE TABLE IF NOT EXISTS jobs ( " +
  "id serial PRIMARY KEY, " +
  "category_id INT NOT NULL, " + 
  "city_id INT NOT NULL, " +
  "job_title VARCHAR(50), " +
  "experience VARCHAR(50), " +
  "education VARCHAR(50), " +
  "salary VARCHAR(50), " +
  "company_name VARCHAR(256), " +
  "FOREIGN KEY (category_id) REFERENCES category (id), " +
  "FOREIGN KEY (city_id) REFERENCES city (id)) "

client.query(query, (err, res) => {
  console.log(err, res);
})






