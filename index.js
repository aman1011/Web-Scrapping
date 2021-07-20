let cities = ['kanpur', 'lucknow', 'chandigarh', 'ahmedabad', 'bengaluru', 'chennai', 'delhi_ncr', 'hyderabad', 'jaipur', 'kolkata', 'ludhiana', 'mumbai', 'pune', 'ranchi','surat'];
let categories = ["technician", "marketing", "human_resource"]
//let cities = ['kanpur']

console.log("\nThis program scrapes jobs from Apna.co")
"use strict";


/*Input */
//const ps = require("prompt-sync");
//const prompt = ps();
//let city = prompt("You want job in which city? ").toLowerCase();
//let category=prompt("What type of job do you want? Select a category(Technician/IT_Support/Marketing/Human_Resource/Teacher/Graphic_Designer/etc.): ").toLowerCase();


/*Scrapping */
const { exit } = require('process');
const puppeteer = require('puppeteer');



async function get_data() {
  const browser = await puppeteer.launch();
  const page =  await browser.newPage();

  /*City */
  for (var i = 0; i < cities.length; i++) {
    for (var j = 0; j < categories.length; j++) {
      city = cities[i];
      category = categories[j];

      console.log("Finding jobs for " + category + " in " + city);
      page.goto('https://apna.co/jobs/jobs-in-' + cities[i]);
      await page.waitForSelector('body');

      const data = await page.evaluate(() => {
        return document.querySelector('section[class="sc-17svb7l-0 iqnvTl"]>h1').innerText 
      });
      console.log('\nThere are total', data)

      // Looping over the page number. We don't know the exact
      // number of pages for job each job category in each city.
      pageCount = 1;
      morePagePresent = true
      while (morePagePresent) {
        page.goto('https://apna.co/jobs/'+category+'-jobs-in-' + city + "?page=" + pageCount);
        console.log("Hitting the URL " + 'https://apna.co/jobs/'+category+'-jobs-in-' + city + "?page=" + pageCount);
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
          jobLookup = {};
          jobLookup['Job Title'] = jobDetails[0];
          jobLookup['Company'] = jobDetails[2];
          jobLookup['Salary'] = jobDetails[4];
          jobLookup['Experience'] = jobDetails[6];
          jobLookup['Education'] = jobDetails[8];
          console.log(jobLookup);
        });
        //console.log("Number of job nodes " + jobNodes[);
        const data2 = await page.evaluate(() => {
          return document.querySelector('p[class="sc-1y4fh76-4 fMBjOI"]').innerText
        });

        pageCount++;
      }
    } 
  } 

  await browser.close();
  return ;
}

get_data()

