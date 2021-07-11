
const puppeteer = require('puppeteer');
;(async() => {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
       
      readline.question('Want job in which city? ', name => {
        
        readline.close();
      });
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    console.log("printing city " + readline)
    await page.goto('https://apna.co/jobs/jobs-in-'+ readline);
    let data= await page.evaluate(() => {
        let headline = document.querySelector('h1[class="sc-17svb7l-2 dAKBvj"]').inner
        return {
            headline
        }
    });
    console.log("Yo printing output")
    console.log(data);
    await browser.close();
})();