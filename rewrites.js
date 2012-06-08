/**
 * this file contains the json representation for rewrite rules
**/
[
{ // rewriting / to index.html
  "from":"/",
  "to":"index.html",
  "method":"GET",
  "query":{}
},
{ // this makes backbone-couchdb _views work properly
  "from": "/ghostwriter/_design/ghostwriter/*",
  "to": "/*"
},
{ // this is for GET, PUT, DELETE of existing models
  "from": "/ghostwriter/:id",
  "to": "../../:id"
},
{ // this handles POST for a new model
  "from": "/ghostwriter/",
  "to": "../../"
},
{ // all other couchapp attachments
  "from" : "/*",
  "to": "/*"
}
]
