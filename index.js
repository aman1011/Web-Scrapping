let cities = ['kanpur', 'lucknow', 'chandigarh','ahmedabad', 'bengaluru', 'chennai', 'delhi_ncr', 'hyderabad', 'jaipur', 'kolkata', 'ludhiana', 'mumbai', 'pune', 'ranchi','surat'];
let categories = ["technician", "marketing", "human_resource"];
//let cities = ['kanpur'];
global.to_insert = []
/*Scrapping */
const { exit } = require('process');
const puppeteer = require('puppeteer');
const fs = require('fs')
const { Pool, Client } = require('pg');
const { Console } = require('console');
const pool = new Pool()


dataToWrite = "Job Title" + ", " + "Company" + ", " + "Salary" + ", " + "Experience" + ", " + "Education" + "\n";
async function get_data() {
  const browser = await puppeteer.launch();
  const page =  await browser.newPage();

  /*City */
  for (var i = 0; i < cities.length; i++) {
    console.log("Processing city " + cities[i] + " ....")

    client = new Client({
      host: 'localhost',
      database: 'scrapper'
    })
    client.connect()
    global.city_id;
    global.category_id;
    // check if the city data is present in the database.
    // If not, then add.
    var sql_statement = "SELECT * FROM city WHERE name = $1";
    client.query(sql_statement, [cities[i]], (err, result) => {
      if (err) throw err;
      if (result.rowCount == 0) {
        // Insert data for the city.
    
        var sql_statement = "INSERT INTO city(name) VALUES($1) RETURNING ID";
        client.query(sql_statement, [cities[i]], (err, res) => {
          if (err) throw err;
          city_id = res.rows[0].id;
          client.query("COMMIT", (err, result) => {
            if (err) {
              console.log("Erorr while committing ....")
              console.log(err);
            } 
          })
        })
      }
      else {
        city_id = result.rows[0].id
        //console.log("City id is ")
        //console.log(city_id)
      }
    }) 


    
    for (var j = 0; j < categories.length; j++) {
      console.log("    Processing category " + categories[j] + " ....");

      // check if the category data is present in the database.
      // If not, then add.
      var sql_statement = "SELECT * FROM category WHERE name = $1";
      client.query(sql_statement, [categories[j]], (err, result) => {
        if (err) throw err;
        if (result.rowCount == 0) {
          // Insert data for the category.
    
          var sql_statement = "INSERT INTO category(name) VALUES($1) RETURNING ID";
          client.query(sql_statement, [categories[j]], (err, res) => {
            if (err) throw err;
            category_id = res.rows[0].id;
            client.query("COMMIT", (err, result) => {
              if (err) {
                console.log("Erorr while committing ....")
                console.log(err);
              } 
            })
          })
        }
        else {
          category_id = result.rows[0].id
          //console.log("Category Id is ")
          //console.log(category_id)
        }
      })


      city = cities[i];
      category = categories[j];

      console.log("        Finding jobs for " + category + " in " + city);
      page.goto('https://apna.co/jobs/jobs-in-' + cities[i], {waitUntil: 'load', timeout: 0});
      await page.waitForSelector('body');

      const data = await page.evaluate(() => {
        return document.querySelector('section[class="sc-17svb7l-0 iqnvTl"]>h1').innerText 
      });


      // Looping over the page number. We don't know the exact
      // number of pages for job each job category in each city.
      pageCount = 1;
      morePagePresent = true
      while (morePagePresent) {
        page.goto('https://apna.co/jobs/'+category+'-jobs-in-' + city + "?page=" + pageCount, {waitUntil: 'load', timeout: 0});
        console.log("       Hitting page " + pageCount + " ....")
        //console.log("Hitting the URL " + 'https://apna.co/jobs/'+category+'-jobs-in-' + city + "?page=" + pageCount);
        await page.waitForSelector('body');

        const data1 = await page.evaluate(() => {
          return document.querySelector('h1[class="sc-17svb7l-2 dAKBvj"]').innerHTML
        });
        if ( !data1 ) {
          console.log("No more jobs on this page ...!")
          morePagePresent = false
        }

        if (! morePagePresent) {
          continue;
        }
        //console.log('There are total', data1)

        // getting the all the nodes for the jobs.
        // one thing to note here is the pagination.
        // hit the url with pagination and check for the returned
        // data. if undefined we have run out of the pages.
        var jobNodes = await page.evaluate(() => {
          let nodes = document.querySelectorAll('div[class="e8x9ni-0 jyAzZx"]>a');
          let jobs = []
          nodes.forEach(element => {
            jobs.push(element.innerText)
          })
          //return document.querySelectorAll('div[class="e8x9ni-0 jyAzZx"]>a')[0].innerText
          return jobs;
        });

        //console.log("The number of jobs" + jobNodes.length);
        jobNodes.forEach(element => {
          //  splitting the job node on the basis of new-line character.
          jobDetails = element.split("\n");
          //console.log(jobDetails);
          jobLookup = {};
          jobLookup['Job Title'] = jobDetails[0];
          jobLookup['Company'] = jobDetails[2];
          jobLookup['Salary'] = jobDetails[4];
          jobLookup['Experience'] = jobDetails[8];
          jobLookup['Education'] = jobDetails[12];
          dataLine = jobLookup['Job Title'] + ', ' + jobLookup['Company'] + ', ' + jobLookup['Salary'].substring(1) + ', ' + jobLookup['Experience'] + ', ' + jobLookup['Education'] + "\n";
          dataToWrite = dataToWrite + dataLine;
          //console.log(jobLookup);
          //  Add to entries.
          to_insert.push([city_id, category_id, jobDetails[0], jobDetails[8], jobDetails[12], jobDetails[4], jobDetails[2]]);
        });
        const data2 = await page.evaluate(() => {
          return document.querySelector('p[class="sc-1y4fh76-4 fMBjOI"]').innerText
        });

        pageCount++;
      }
    } 
  } 
  //console.log(dataToWrite);
  writeToCSVFile(dataToWrite);
  //console.log(to_insert)
  return to_insert;
}


function writeToCSVFile(data) {
  const filename = 'output.csv';
  fs.writeFile(filename, dataToWrite, err => {
    if (err) {
      console.log('Error writing to csv file', err);
    }
  });
}

function insert_into_data(to_insert) {
  //console.log(to_insert);
  console.log(to_insert.length)


  to_insert.forEach(element => {
    var search_sql = "SELECT * from jobs where city_id = " + element[0] + 
      " and category_id = " + element[1] + 
      " and job_title =  '" + element[2] + "'" +
      " and experience =  '" + element[3]  + "'" +
      " and education = '" + element[4] + "'" +
      " and salary = '" + element[5] + "'" + 
      " and company_name = '" + element[6] + "'"

    // console.log(search_sql);
    client.query(search_sql, (err, res) => {
      if (err) throw err;
      if (res.rowCount == 0) {
        // Insert the data.
        insert_query = "INSERT INTO jobs (city_id, category_id, job_title, experience, education, salary, company_name) VALUES($1, $2, $3, $4, $5, $6, $7)"
        client.query(insert_query, [element[0],element[1],element[2],element[3],element[4],element[5],element[6]], (err, result) => {
          if (err) throw err;
        })
      }
      else {
        "The job is already present in the database ...."
      }
    })
  });
}

get_data().then(res => {
  console.log(res.length)
  to_insert.forEach(element => {
    var param_search = "SELECT * from jobs where city_id = $1 and category_id = $2 and job_title = $3 and experience = $4 and education = $5 and salary = $6 and company_name = $7"

    //console.log();
    client.query(param_search, [element[0], element[1], element[2], element[3], element[4], element[5], element[6]], (err, res) => {
      if (err) {
        console.log(err);
      }
      if (res && res.rowCount == 0) {
        // Insert the data.
        insert_query = "INSERT INTO jobs (city_id, category_id, job_title, experience, education, salary, company_name) VALUES($1, $2, $3, $4, $5, $6, $7)"
        client.query(insert_query, [element[0],element[1],element[2],element[3],element[4],element[5],element[6]], (err, result) => {
          if (err) throw err;
        })
      }
      else {
        "The job is already present in the database ...."
      }
    })
  });
})






