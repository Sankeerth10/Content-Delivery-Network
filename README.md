# Content-Delivery-Network

**Content Delivery Network (CDN) & Dashboard**
*Introduction*
CDN serves as a middleware network of servers handling content delivery for a web application. It reduces the load on the main server, ensuring reduced load times for resources to clients. This CDN setup comprises a Controller server and three Edge servers, mimicking actual server behavior.

*CDN Components*
Controller Server: Running on localhost at port 3001.
Edge Servers: E1 - New Delhi, E2 - Berlin, E3 - Montreal, simulated as local servers.
Main Server: Website using the CDN situated at localhost, also running on Express Server.
Tech Stack: CDN network powered by Node.js backend and MongoDB as the database for content storage.

*CDN Functionality*

*How it Works*
Upon server start, syncs all edge servers with cached content.
Client requests access to the website.
Request directed to CDN's Controller server.
Controller server manages edge server selection based on request count and round-robin logic.
Checks chosen edge server for requested content availability.
If content present, served from the edge server; if not, fetched from the main server and served to the client.
Content not present on the edge server prompts the Controller server to employ a pull strategy, fetching content from the main server.
Pulled content stored in the chosen edge server, which then serves the requested content to the client.
Operations
Use https://localhost:3001/delete-everything in the browser to reset cached data.
Access all logs via https://localhost:3001/logs.

*Code Explanation*
app.js: Main server running Express, containing API routes.
config.js: Configuration file with CDN server settings.
cdn.controller.js: Core controller file with functions for edge server selection and content handling.
cdn.model.js: Database schema for cached entries.
cdn.routes.js: Contains the primary route serving cached files.
util.js: Helper file with utility functions for file handling.
CDN Dashboard
Features
Angular-based dashboard for managing multiple configurable edge servers.
Running at https://localhost:4002.
To start, run ng serve in the terminal, initiating the dashboard on port 4200.
Pre-created mandatory servers with options to add and delete configurable edge servers.

*CDN Controller Deployment*
Steps to Run
Running Website:

Install necessary libraries with npm i.
Run the server with set NODE_TLS_REJECT_UNAUTHORIZED='0' for Windows or export NODE_TLS_REJECT_UNAUTHORIZED='0' for MacOS or Linux, followed by node app.js. The original server operates at https://localhost:3002.
Running CDN Controller:

Install required libraries via npm install.
Start the server with the commands for TLS rejection and node app.js. The CDN controller operates at https://localhost:3001.
Notes
Both CDN controller and website use the latest HTTP2 protocol and necessitate server execution using HTTPS in localhost.
Enable the protocol column in Chrome's developer portal network tab to observe the HTTP2 protocol in action.
Follow Heroku's SSL Certificate guidelines for SSL creation.