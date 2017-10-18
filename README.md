# calibre-scraper-serverless
Simple serverless service to scrape data from the Calibre app and send it to a Google spreadsheet

## Installation
Clone the project, go to the created folder and run
```
npm install
```
Change serverless variables example filename
```
mv serverless.env.yml.example serverless.env.yml
```
and fill it with your credentials.

Change `SHEET_NAME` in `serverless.yml` to the name of sheet data will be imported to.

Go to Google Cloud Platform and create a project, then enable Google spreadsheet API.

Go to Credentials, create Service account key, download it as JSON file, rename it to key.json and put into project folder.

Move downloaded file to project's folder and change it's name to `key.json`

To deploy service to the AWS lambda
```
serverless deploy -v
```

To invoke the function
```
serverless invoke -f scrape -l
```
