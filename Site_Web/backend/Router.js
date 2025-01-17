import fetch from 'node-fetch';
import bcrypt from "bcrypt"
import path from "path";
import { Client } from '@elastic/elasticsearch'
import * as url from 'url';
import c from 'spacy';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const dirPath = path.join(__dirname, '/build/index.html');

const ElasticClient = new Client({
  node: 'http://localhost:30200',
})

export default class Router {
  constructor(app, db) {
    this.login(app, db);
    this.logout(app, db);
    this.isLoggedIn(app, db);
    this.register(app, db);
    this.UpdateUsername(app, db);
    this.UpdatePassworld(app, db);
    this.UpdateEmail(app, db);
    this.UpdatePreference(app, db);
    this.GetUsers(app, db);
    this.toggleAdmin(app, db);
    this.DeleteUser(app, db);
    this.getNews(app);
    this.getFilters(app);

    this.GetStats(app);

    this.getNewsByID(app, db);
    this.GetSimilarNewsByID(app);
    this.GetRecomandedNews(app, db);

    app.get('/*', function (req, res) {
      res.sendFile(dirPath, function (err) {
        if (err) {
          res.status(500).send(err)
        }
      })
    })
  }

  DeleteUser(app, db) {
    app.post("/DeleteUser", (req, res) => {
      let UserID = req.body.ID;
      let values = [UserID, UserID];

      db.query(
        "DELETE tranzactii FROM tranzactii INNER join conturi as SConturi on SConturi.ID = tranzactii.SContID INNER join conturi as RConturi on RConturi.ID = tranzactii.RContID WHERE SConturi.UserID = ? or RConturi.UserID = ?",
        values
      );

      db.query("DELETE conturi FROM conturi WHERE conturi.UserID = ?", UserID);

      db.query(
        "DELETE credite FROM `credite` WHERE credite.UserID = ?",
        UserID
      );

      db.query(
        "DELETE conteconomii FROM conteconomii WHERE conteconomii.UserID = ?",
        UserID
      );
      db.query(
        "DELETE users  FROM users WHERE users.ID = ?",
        UserID,
        (err, data, fields) => {
          if (err) {
            res.json({
              success: false,
              msg: "Baza de date a intampinat o eroare",
            });

            return;
          } else {
            res.json({
              success: true,
            });
          }
        }
      );
    });
  }


  toggleAdmin(app, db) {
    app.post("/ToggleAdmin", (req, res) => {
      let UserID = req.body.ID;
      let new_admin = req.body.Admin;
      let values = [new_admin, UserID];
      db.query(
        "UPDATE `users` SET Admin = ? WHERE users.ID = ?",
        values,
        (err, data, fields) => {
          if (err) {
            res.json({
              success: false,
              msg: "Baza de date a intampinat o eroare",
            });

            return;
          } else {
            res.json({
              success: true,
            });
          }
        }
      );
    });
  }

  GetUsers(app, db) {
    app.post("/GetUsers", (req, res) => {
      let UserID = req.session.userID;
      db.query(
        "SELECT * FROM `users` WHERE ID != ?",
        UserID,
        (err, data, fields) => {
          if (err) {
            res.json({
              success: false,
              msg: "Baza de date a intampinat o eroare",
            });

            return;
          } else {
            res.json({
              success: true,
              data: data,
            });
          }
        }
      );
    });
  }

  UpdateUsername(app, db) {
    app.post("/UpdateUsername", (req, res) => {
      let username = req.body.username;
      let values = [username, req.session.userID];
      db.query(
        "UPDATE `users` SET `Username` = ? WHERE `users`.`ID` = ?",
        values,
        (err, data, fields) => {
          if (err) {
            res.json({
              success: false,
              msg: "Eroare",
            });
          } else {
            res.json({
              success: true,
            });
            return true;
          }
        }
      );
    });
  }

  UpdatePassworld(app, db) {
    app.post("/UpdatePassworld", (req, res) => {
      let passwolrd = bcrypt.hashSync(req.body.passwolrd, 9);
      let values = [passwolrd, req.session.userID];
      db.query(
        "UPDATE `users` SET `Password` = ? WHERE `users`.`ID` = ?",
        values,
        (err, data, fields) => {
          if (err) {
            res.json({
              success: false,
              msg: "Eroare",
            });
          } else {
            res.json({
              success: true,
            });
            return true;
          }
        }
      );
    });
  }

  UpdateEmail(app, db) {
    app.post("/UpdateEmail", (req, res) => {
      let email = req.body.email;
      let values = [email, req.session.userID];
      db.query(
        "UPDATE `users` SET `Email` = ? WHERE `users`.`ID` = ?",
        values,
        (err, data, fields) => {
          if (err) {
            res.json({
              success: false,
              msg: "Eroare",
            });
          } else {
            res.json({
              success: true,
            });
            return true;
          }
        }
      );
    });
  }

  UpdatePreference(app, db) {
    app.post("/UpdatePreference", (req, res) => {
      let preference = req.body.preference;
      UpdateUserPreference(db, req.session.userID, preference).then((response) => { res.json(response) });
      return;
    });
  }


  register(app, db) {
    app.post("/register", (req, res) => {
      let username = req.body.username;
      let password = bcrypt.hashSync(req.body.password, 9);
      let email = req.body.email;
      let visited = "SCIENCE:0-ARTS AND CULTURE:0-BUSINESS TRAVEL:0-POLITICS:0-HEALTHY LIVING:0-FOOD AND DRINK:0-CRIME:0-HOME AND LIVING:0-RELIGION:0-STYLE AND BEAUTY:0-SPORTS:0-ENVIRONMENT:0-ENTERTAINMENT:0-EDUCATION:0-";
      RegisterUser(db, username, password, email, "/costume", visited).then((response) => { res.json(response) });
      return;
    })
  }

  login(app, db) {
    app.post("/login", (req, res) => {
      let username = req.body.username;
      let password = req.body.password;

      CheckLoginCreds(db, username, password).then((response) => {
        let responseJ = JSON.parse(response);
        req.session.userID = responseJ.id;
        res.json(response)
      });
      return;
    })
  }

  logout(app, db) {
    app.post("/logout", (req, res) => {
      if (req.session.userID) {
        req.session.destroy();
        res.json({
          success: true,
        });
        return true;
      } else {
        res.json({
          success: false,
        });
        return false;
      }
    });
  }

  isLoggedIn(app, db) {
    app.post("/isLoggedIn", (req, res) => {
      if (req.session.userID) {
        CheckIsLoggedIn(db, req.session.userID).then((response) => { res.json(response) })
        return;
      } else {
        res.json({
          success: "false",
        });
        return;
      }
    });
  }

  getNews(app) {
    app.post("/getNews", (req, res) => {

      queryElasticNews(ElasticClient, req.body.filters, req.body.from).then((response) => {
        res.json({
          success: "true",
          data: response,
        });
      });
      return
    });
  }

  getFilters(app) {
    app.post("/getFilters", (req, res) => {
      queryElasticFilters(ElasticClient).then((response) => {
        let publications = [];
        response.total_returns.aggregations.publications.buckets.forEach(element => publications.push(element.key))
        let Categories = ["SCIENCE", "ARTS AND CULTURE", "BUSINESS", "TRAVEL", "POLITICS", "HEALTHY LIVING", "FOOD AND DRINK", "CRIME", "HOME AND LIVING", "RELIGION", "STYLE AND BEAUTY", "SPORTS", "ENVIRONMENT", "ENTERTAINMENT", "EDUCATION", "No category"];
        res.json({
          success: "true",
          Publications: publications,
          Categories: Categories,
          WordsCount: [response.total_returns.aggregations.min_wordCount.value, response.total_returns.aggregations.max_wordCount.value],
          SentimentScore: [0, 1]
        });
      });
      return
    });
  }

  getNewsByID(app, db) {
    app.post("/GetNewsByID", (req, res) => {
      queryElasticNewsByID(ElasticClient, req.body.ID).then((response) => {

        if (response === false) {
          res.json({
            success: false,
          });
        }
        else {
          res.json({
            success: true,
            data: response,
          });
        }
      });
      return
    });

  }

  GetRecomandedNews(app, db) {
    app.post("/GetRecomandedNews", (req, res) => {
      if (req.session.userID) {
        GetRecomandedNewsForUser(db, ElasticClient, req.session.userID, req.body.ID).then((response) => {
          res.json({
            success: true,
            data: response,
          });
        });
      }
      return
    });
  }

  GetSimilarNewsByID(app) {
    app.post("/GetSimilarNewsByID", (req, res) => {
      RESTGetSimilarNews(req.body.ID).then((response) => {
        res.json({
          success: true,
          data: response,
        })
        return
      })

    });
  }

  GetStats(app) {
    app.post("/GetStats", (req, res) => {
      queryElasticGetStats(ElasticClient).then((response) => {
        res.json({
          success: true,
          data: response,
        });
      });
      return
    });
  }

}
//////////// REST ////////////
async function RESTGetSimilarNews(ID) {
  let response = await fetch('http://localhost:5000/similarity/' + ID);
  response = await response.json()
  return response;
}

//////////// Elasticsearch ////////////

async function queryElasticGetStats(ElasticClient) {
  let response = await ElasticClient.search({
    index: "news",
    body: {
      "size": 0,
      "aggs": {
        "avrageWordCount": { "avg": { "field": "Word_Count" } },
        "avragePositivity": { "avg": { "field": "Procent_Pozitiv" } }
      }
    }
  });

  let avrageWordCount = response.aggregations.avrageWordCount.value;
  let avragePositivity = response.aggregations.avragePositivity.value;

  //get the number of news with Procent_Pozitiv lower then 0.3 from each RSSTag
  let response2 = await ElasticClient.search({
    index: "news",
    body: {
      "size": 0,
      "aggs": {
        "RSSTags": {
          "terms": {
            "field": "RSSTag",
            "size": 100
          },
          "aggs": {
            "NegativenewsCount": {
              "filter": {
                "range": {
                  "Procent_Pozitiv": {
                    "lte": 0.3
                  }
                }
              }
            },
            "NeutralnewsCount": {
              "filter": {
                "range": {
                  "Procent_Pozitiv": {
                    "gt": 0.3,
                    "lt": 0.7,
                  }
                }
              }
            },
            "PozitivenewsCount": {
              "filter": {
                "range": {
                  "Procent_Pozitiv": {
                    "gte": 0.7,
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  let RSSTags = response2.aggregations.RSSTags.buckets;

  return {
    avrageWordCount: avrageWordCount,
    avragePositivity: avragePositivity,

    RSSTagsNewsCount: RSSTags
  }


}

async function queryElasticNewsByID(ElasticClient, ID) {
  let result = await ElasticClient.search({
    index: 'news',
    query: {
      "match": {
        _id: ID,
      }
    },
  })
  try {
    let response = {
      link: result.hits.hits[0]._source.link,
      image: result.hits.hits[0]._source.image,
      title: result.hits.hits[0]._source.title,
      pubDate: result.hits.hits[0]._source.pubDate,
      content: result.hits.hits[0]._source.content,
      Procent_Pozitiv: result.hits.hits[0]._source.Procent_Pozitiv,
      Paragraf_Pozitiv: result.hits.hits[0]._source.Paragraf_Pozitiv,
      Word_Count: result.hits.hits[0]._source.Word_Count,
      RSSTag: result.hits.hits[0]._source.RSSTag,
      Category: result.hits.hits[0]._source.category,
    }

    return (response)
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function queryElasticFilters(ElasticClient) {
  const result = await ElasticClient.search({
    index: 'news',
    "size": 0,
    "aggs": {
      "publications": {
        "terms": { "field": "RSSTag" }
      },
      "max_wordCount": { "max": { "field": "Word_Count" } },
      "min_wordCount": { "min": { "field": "Word_Count" } }
    }

  })


  return ({
    success: true,
    total_returns: result,
  });
}

async function queryElasticNews(ElasticClient, filters, from) {

  let sortFilter = "";
  if (filters.OrderBy === "leatest") {
    sortFilter = [
      {
        "pubDate": {
          "order": "desc",
        }
      }];
  }
  else if (filters.OrderBy === "earliest") {
    sortFilter = [
      {
        "pubDate": {
          "order": "asc",
        }
      }];
  }
  else {
    sortFilter = ["_score"];
  }

  let Categories = filters.Categories;

  for (let i = 0; i < Categories.length; i++) {
    Categories[i] = Categories[i].replace(/\sAND\s/g, " & ");
  }


  let regexString = ".*(";
  for (let i = 0; i < Categories.length; i++) {
    regexString += Categories[i];
    if (i < Categories.length - 1) {
      regexString += "|";
    }
  }
  regexString += ").*";

  if (Categories.length < 1) {
    regexString = "NO MATCH";
  }

  let result = ""
  if (filters.Search != null) {
    result = await ElasticClient.search({
      index: 'news',
      from: from,
      query: {
        bool: {
          must: [
            {
              terms: {
                "RSSTag": filters.Publications,
              }
            },
            {
              range: {
                "Word_Count": {
                  "gte": filters.WordsCount[0],
                  "lte": filters.WordsCount[1]
                }
              }
            },
            {
              range: {
                "Procent_Pozitiv": {
                  "gte": filters.SentimentScore[0],
                  "lte": filters.SentimentScore[1]
                }
              }
            },

          ],
          should: [
            {
              "multi_match": {
                "query": filters.Search,
                "fields": ["content", "description", "title"]
              }
            },
            {
              "multi_match": {
                "query": filters.Search,
                "fields": ["content", "description", "title"],
                "operator": "and"
              }
            },
            {
              "multi_match": {
                "query": filters.Search,
                "fields": ["content", "description", "title"],
                "type": "phrase",
                "boost": 5,
              }
            }],
          "minimum_should_match": 1,
        },

      },
      sort: sortFilter,
      size: filters.ItemsPerPage
    })
  }
  else {
    result = await ElasticClient.search({
      index: 'news',
      from: from,
      query: {
        bool: {
          must: [
            {
              terms: {
                "RSSTag": filters.Publications,
              }
            },
            {
              regexp: {
                "category": {
                  "value": regexString,
                  max_determinized_states: 100000
                }
              },
            },
            {
              range: {
                "Word_Count": {
                  "gte": filters.WordsCount[0],
                  "lte": filters.WordsCount[1]
                }
              }

            },
            {
              range: {
                "Procent_Pozitiv": {
                  "gte": filters.SentimentScore[0],
                  "lte": filters.SentimentScore[1]
                }
              }
            }
          ],
        }
      },
      sort: sortFilter,
      size: filters.ItemsPerPage
    })
  }


  let data = result["hits"]["hits"].map((news) => {
    return {
      id: news._id,
      title: news._source.title,
      description: news._source.description,
      pubDate: news._source.pubDate,
      source: news._source.source,
      publication: news._source.RSSTag,
      Category: news._source.category,
    }
  })

  return ({
    success: true,
    data: data,
    total_returns: result["hits"]["total"]["value"],
  });
}

//////////// MySQL ////////////

async function CheckIsLoggedIn(db, sessionId) {
  let values = sessionId;
  const result = await db.query("SELECT * FROM users WHERE ID = ? LIMIT 1", values);

  let rows = result[0]
  let count = 0
  rows.forEach(item => {
    count++;
  })

  if (count > 0) {
    for (const item in rows) {
      return JSON.stringify({
        success: true,
        username: rows[item].Username,
        admin: rows[item].Admin,
        email: rows[item].Email,
        id: rows[item].ID,
        preference: rows[item].Preference
      })
    }
  }
  else {
    return JSON.stringify({
      success: false,
    })
  }
}


async function CheckLoginCreds(db, username, password) {

  try {

    let values = username;
    const result = await db.query("SELECT * FROM users WHERE Username = ?", values);

    let rows = result[0]

    let count = 0
    rows.forEach(item => {
      count++;
    })

    if (count > 0) {
      for (const item in rows) {
        if (rows[item].Username == username) {
          if (await bcrypt.compare(password, rows[item].Password)) {
            return JSON.stringify({
              success: true,
              msg: "Success",
              success: true,
              username: rows[item].Username,
              admin: rows[item].Admin,
              email: rows[item].Email,
              id: rows[item].ID,
              preference: rows[item].Preference,
            })
          }
          return JSON.stringify({
            success: false,
            msg: "Incorrect password",
          })
        }
      }

      return JSON.stringify({
        success: false,
        msg: "Incorrect credentials",
      })
    }
    else {
      return JSON.stringify({
        success: false,
        msg: "Incorrect credentials",
      })
    }
  }
  catch (e) {
    return JSON.stringify({
      success: false,
      msg: "Unknown error",
    })
  }
}

async function RegisterUser(db, username, password, email, preference, visited) {
  let values = username;
  const result = await db.query("SELECT * FROM users WHERE Username = ?", values);
  let rows = result[0]

  let count = 0
  rows.forEach(item => {
    count++;
  })

  if (count == 0) {
    let values = [username, password, email, preference, visited];
    let result = await db.query("INSERT INTO users (Username, Password,	Email, Preference,Visited) VALUES (? , ? , ? , ?, ?)", values);
    if (result == null) {
      return JSON.stringify({
        success: false,
        msg: "An error has occured",
      })
    }
    else {
      return JSON.stringify({
        success: true,
        msg: "New user account has been created",
      })
    }
  }
  else {
    return JSON.stringify({
      success: false,
      msg: "Username is already taken",
    })
  }
}

async function UpdateUserPreference(db, id, preference) {
  let values = [preference, id];
  let result = await db.query("UPDATE users SET Preference = ? WHERE ID = ?", values);
  if (result == null) {
    return JSON.stringify({
      success: false,
      msg: "An error has occured",
    })
  }
  else {
    return JSON.stringify({
      success: true,
      msg: "User preference updated",
    })
  }
}

async function GetRecomandedNewsForUser(db, ElasticClient, id, ID) {



  let result = await ElasticClient.search({
    index: 'news',
    query: {
      "match": {
        _id: ID,
      }
    },
  })

  let Categories = result.hits.hits[0]._source.category;


  /////////////////

  let values = id;
  result = await db.query("SELECT Visited FROM users WHERE ID = ?", values);

  let rows = result[0]

  let count = 0
  rows.forEach(item => {
    count++;
  })

  if (count > 0) {
    let Visited = rows[0].Visited;

    let VisitedArray = Visited.split("-");

    VisitedArray.pop();

    let VisitedObjects = VisitedArray.map(item => {
      return item.split(":");
    })

    let VisitedDictionary = {};
    VisitedObjects.forEach(item => {
      VisitedDictionary[item[0]] = item[1];
    })



    let CategoriesArray = Categories.split("-");


    let CategoriesObjects = CategoriesArray.map(item => {
      return item.split("*");
    })

    let CategoriesDictionary = {};
    CategoriesObjects.forEach(item => {
      CategoriesDictionary[item[0]] = item[1];
    })

    for (const key in CategoriesDictionary) {
      if (VisitedDictionary[key] != null) {
        VisitedDictionary[key] = parseInt(VisitedDictionary[key]) + 1;
      }
    }

    let VisitedString = "";
    for (const key in VisitedDictionary) {
      VisitedString += key + ":" + VisitedDictionary[key] + "-";
    }

    let values = [VisitedString, id];
    const result = await db.query("UPDATE users SET Visited = ? WHERE ID = ?", values);


    ///////////////////////////////

    //make VisitedDictionary values into procentages
    let total = 0;
    for (const key in VisitedDictionary) {
      total += parseInt(VisitedDictionary[key]);
    }

    for (const key in VisitedDictionary) {
      VisitedDictionary[key] = parseInt(parseFloat(VisitedDictionary[key]) / total * 100);
    }

    console.log(VisitedDictionary)

    let GetCategories = [];
    for (let i = 0; i < 5; i++) {
      let random = Math.floor(Math.random() * 100);
      let count = 0;
      for (const key in VisitedDictionary) {
        count += VisitedDictionary[key];
        if (count >= random) {
          GetCategories.push(key);
          break;
        }
      }
    }

    console.log(GetCategories);


    //query ElasticSearch and get a news from the each category with regex

    let News = [];
    for (const key in GetCategories) {
      let value = GetCategories[key];
      let regexString = ".*" + value + ".*";

      let result2 = await ElasticClient.search({
        index: 'news',
        body: {
          query: {
            regexp: {
              "category": {
                "value": regexString,
                max_determinized_states: 100000
              }
            },
          }
        }
      });

      let hits = result2.hits.hits;

      let news = [];

      hits.forEach(item => {

        item._source._id = item._id;
        news.push(item._source);
      })

      let random = Math.floor(Math.random() * news.length);

      let newsObject = {
        publication: news[random].RSSTag,
        title: news[random].title,
        pubDate: news[random].pubDate,
        Category: news[random].category,
        id: news[random]._id,
      }

      News.push(newsObject);
    }
    return News;
  }
}
