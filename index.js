let cities = ['kanpur', 'lucknow', 'chandigarh', 'ahmedabad', 'bengaluru', 'chennai', 'delhi_ncr', 'hyderabad', 'jaipur', 'kolkata', 'ludhiana', 'mumbai', 'pune', 'ranchi','surat'];
let categories = ["technician", "marketing", "human_resource"];


/*Scrapping */
const { exit } = require('process');
const puppeteer = require('puppeteer');
const fs = require('fs')
const { Pool, Client } = require('pg')


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
      console.log("Processing category " + categories[j] + " ....");

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

      console.log("Finding jobs for " + category + " in " + city);
      page.goto('https://apna.co/jobs/jobs-in-' + cities[i]);
      await page.waitForSelector('body');

      const data = await page.evaluate(() => {
        return document.querySelector('section[class="sc-17svb7l-0 iqnvTl"]>h1').innerText 
      });


      // Looping over the page number. We don't know the exact
      // number of pages for job each job category in each city.
      pageCount = 1;
      morePagePresent = true
      while (morePagePresent) {
        page.goto('https://apna.co/jobs/'+category+'-jobs-in-' + city + "?page=" + pageCount);
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
          
          // Check if entry in the jobs is already present.
          var search_sql = "SELECT * from jobs where city_id = $1 and category_id = $2 and job_title = $3 and experience = $4 and education = $5 and salary = $6 and company_name = $7";
          client.query(search_sql, [city_id, category_id, jobDetails[0], jobDetails[8], jobDetails[12], jobDetails[4], jobDetails[2]], (err, result) => {
            if (err) throw err;
            if (result.rowCount == 0) {
              console.log("Inserting row with following values ....");
              console.log(city_id + " " + category_id + " " +  jobDetails[0] + " " +  jobDetails[8] + " " +  jobDetails[12] + " " +  jobDetails[4] + " " +  jobDetails[2]);
              insert_query = "INSERT INTO jobs (city_id, category_id, job_title, experience, education, salary, company_name) VALUES($1, $2, $3, $4, $5, $6, $7)"
              client.query(insert_query, [city_id, category_id, jobDetails[0], jobDetails[8], jobDetails[12], jobDetails[4], jobDetails[2]], (err, result) => {
                if (err) throw err;
              })              
            }
            else {
              console.log("Job already exists in database ....");
            }
          })
        });
        const data2 = await page.evaluate(() => {
          return document.querySelector('p[class="sc-1y4fh76-4 fMBjOI"]').innerText
        });

        pageCount++;
      }
    } 
  } 
  console.log(dataToWrite);
  writeToCSVFile(dataToWrite);
  try {
    await browser.close();
  } catch (error) {
    console.log("Typical browser error at the end ....!");
  }
  
  return dataToWrite;
}


function writeToCSVFile(data) {
  const filename = 'output.csv';
  fs.writeFile(filename, dataToWrite, err => {
    if (err) {
      console.log('Error writing to csv file', err);
    } else {
      console.log(`saved as ${filename}`);
    }
  });
}


data = get_data();






