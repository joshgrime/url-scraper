# url-scraper

URL web scraper

This little project is written in Node.js and uses a MySQL database.

It scans a given page for any links to other pages and stores these in a 'queue' table in the database. It then adds the searched page to a 'completed' table in the database with how many unique URLs were found, then chooses a new URL from the 'queue' at random and continually repeats the process.
