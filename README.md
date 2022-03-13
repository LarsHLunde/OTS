# One Time Secret

## Scope
This program saves secret messages with randomly created URL's  
the secret seizes to exist (entirely) once opened.  
  
It's still somewhat beta, and a lot of variables need to be set manually.  
I hope to have it working a lot better by version 1.1,  
although it is fully working if you set all the variables.

## Technologies
OTS uses Bootstrap 3.6 for frontend, combined with custom JS,  
the backend is all written in Node.js and Express and  
for database I'm using a Redis instance on localhost.

## Alpha 1.0
### Known Issues
- All the linked css and JS files break upon deployment (can be fixed manually)
- All the ajax calls need to be fixed manually to make the application work
- The link generator in script-admin.js link generator needs to be adjusted manually
- Admin password only exists and can only be adjusted from index.js
- Ajax create secret callback doesn't work, so the list just updates on timer and not on action

### Plans
|Task|State|
|-|-|
|Fix ajax callback for update and increase refresh timer for secret list|:heavy_check_mark:|
|Create yum installer script|:heavy_check_mark:|
|Install dotenv for project|:heavy_check_mark:|
|Move url prepend to dotenv|:heavy_check_mark:|
|Load all served files to memory|:heavy_check_mark:|
|Add reference-markers to served files|:heavy_check_mark:|
|Create a variable replacement function|:heavy_check_mark:|
|Replace reference markers with set variables|:heavy_check_mark:|
|Fix favicon placement|:heavy_check_mark:|
|Add secret labels|:x:|
|Move password from index.js to redis|:x:|
|Rewrite express-basic-auth to use redis|:x:|
|"Create default" password mechanism|:x:|
|Add crypto library|:x:|
|Encrypt admin password|:x:|
|Add button for password change|:x:|
|Make a logout button|:x:|
|Fix bug where empty messages error out|:x:|
|Make look nicer|:x:|
