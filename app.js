var express = require('express'),
  path = require('path'),
  favicon = require('serve-favicon'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  fs = require("fs"),
  index = require('./routes/index'),
  users = require('./routes/users'),
  request = require('request'),
  base64 = require('base-64'),
  rn = require('random-number'),
  app = express();

app.listen(2000);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

//catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// Add headers
app.use(function(req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

//Post from the clients to add Account into the application. Check from dataBase and the insert to it.
app.post('/addAccount', function(req, res, err) {
  var obj = require("./Profile.json");
  var flag = 0;
  var gen = rn.generator({
    min: 10000,
    max: 99999,
    integer: true
  })
  obj.Account.forEach(function(item) {
    if (item.Email == req.body.Email) {
      console.log("same Email exist!");
      flag = 1;
      res.end(JSON.stringify("{'status':'SameEmail'}"));
    } else if (item.userName == req.body.userName) {
      console.log("same userName exist!");
      flag = 1;
      res.end(JSON.stringify("{'status':'SameUserName'}"));
    }
  });
  if (flag == 0) {
    var temp = {
      "Email": req.body.Email,
      "Password": req.body.Password,
      "PhoneNumber": req.body.PhoneNumber,
      "userName": req.body.userName,
      "name": req.body.Name + '-' + req.body.Family,
      "AccountId": gen(),
      "ParentAccountId": 0,
      "IsActive": "",
      "followers": [],
      "wannaList": [],
      "readingList": [],
      "readList": []
    };
    obj.Account.push(temp);
    fs.writeFile("./Profile.json", JSON.stringify(obj));
    console.log("Adding complete.");
    res.end(JSON.stringify("{'status':'Ok'}"));
  }

  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }

})

//Login into the application.
app.post('/login', function(req, res, err) {
  var obj = require("./Profile.json");
  var flag = 0;
  var Informations = {
    "status": "Ok",
    "Information": []
  };
  console.log(req.body)
  obj.Account.forEach(function(item) {
    if ((item.userName == req.body.userName || item.Email == req.body.userName) && item.Password == req.body.Password) {
      console.log(req.body.Email + " login successfully");
      flag = 1;
      var temp = {
        "Name": item.Name + " " + item.Family,
        "userName": item.userName,
        "Email": item.Email,
        "PhoneNumber": item.PhoneNumber,
        "AccountId": item.AccountId,
        "Balance": item.OpeningBalance
      }
      Informations.Information.push(temp);
      res.end(JSON.stringify(Informations));
    }
  });
  if (flag == 0) {
    console.log(req.body.Email + " login failed");
    res.end(JSON.stringify({
      status: "Fail"
    }));
  }
  if (err) {
    res.end(JSON.stringify({
      status: "Error"
    }));
  }
});

//check application license
app.post('/getLicense', function(req, res, err) {
  console.log(req.body);
  var obj = require("./license.json");
  var temp;
  obj.apps.forEach(function(item) {
    if (item.appName == req.body.appName) {
      if (item.license == true) {
        temp = {
          license: true
        };
      } else if (item.license == false) {
        temp = {
          license: false
        };
      }
    }
  })
  res.end(JSON.stringify(temp));
})

//send the information of the entry email as a client
app.post('/sendClientInformation', function(req, res, err) {
  var obj = require("./Profile.json");
  var temp;
  var Informations = {
    "status": "Ok",
    "Information": []
  };
  obj.Account.forEach(function(item) {
    if (item.Email == req.body.Email) {
      temp = {
        "Name": item.Name + " " + item.Family,
        "Email": item.Email,
        "PhoneNumber": item.PhoneNumber,
        "AccountId": item.AccountId,
        "Balance": item.OpeningBalance
      }
      Informations.Information.push(temp);
    }
  });
  res.end(JSON.stringify(Informations));
  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }
})

app.post('/:user/wannaToRead', function(req, res, err) {
  var user = req.params.user;
  var obj = require("./Profile.json");
  var bookObj = require("./Book.json");
  var temp;

  var Informations = {
    "status": "Ok",
    "Information": []
  };
  obj.Account.forEach(function(item) {
    if (item.userName == user) {
      item.wannaList.forEach(function(list) {
        bookObj.Book.forEach(function(book) {
          if (list == book.bookID) {
            temp = {
              "bookID": book.bookID,
              "title": book.title,
              "writer": book.writer,
              "translators": book.translators,
              "publication": book.publication,
              "dateOfPublication": book.dateOfPublication,
              "lang": book.lang
            }
            Informations.Information.push(temp);
          }
        });
      });
    }
  });
  res.header("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(Informations));

  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }

});


app.post('/:user/reading', function(req, res, err) {
  var user = req.params.user;
  var obj = require("./Profile.json");
  var bookObj = require("./Book.json");
  var temp;

  var Informations = {
    "status": "Ok",
    "Information": []
  };
  obj.Account.forEach(function(item) {
    if (item.userName == user) {
      item.readingList.forEach(function(list) {
        bookObj.Book.forEach(function(book) {
          if (list == book.bookID) {
            temp = {
              "bookID": book.bookID,
              "title": book.title,
              "writer": book.writer,
              "translators": book.translators,
              "publication": book.publication,
              "dateOfPublication": book.dateOfPublication,
              "lang": book.lang
            }
            Informations.Information.push(temp);
          }
        });
      });
    }
  });

  res.header("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(Informations));

  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }

});

app.post('/:user/read', function(req, res, err) {
  var user = req.params.user;
  var obj = require("./Profile.json");
  var bookObj = require("./Book.json");
  var temp;

  var Informations = {
    "status": "Ok",
    "Information": []
  };
  obj.Account.forEach(function(item) {
    if (item.userName == user) {
      item.read.forEach(function(list) {
        bookObj.Book.forEach(function(book) {
          if (list == book.bookID) {
            temp = {
              "bookID": book.bookID,
              "title": book.title,
              "writer": book.writer,
              "translators": book.translators,
              "publication": book.publication,
              "dateOfPublication": book.dateOfPublication,
              "lang": book.lang

            }
            Informations.Information.push(temp);
          }
        });
      });
    }
  });

  res.header("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(Informations));

  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }

});


app.post('/:user/followers', function(req, res, err) {
  var user = req.params.user;
  var obj = require("./Profile.json");
  var folowObj = require("./Profile.json");
  var temp;

  var Informations = {
    "status": "Ok",
    "Information": []
  };

  obj.Account.forEach(function(item) {
    if (item.userName == user) {
      item.fallowers.forEach(function(folow) {
        folowObj.Account.forEach(function(content) {
          if (folow == content.userName) {
            temp = {
              "Email": content.Email,
              "Password": content.Password,
              "PhoneNumber": content.PhoneNumber,
              "userName": content.userName,
              "name": content.name
            }
            Informations.Information.push(temp);
          }
        });
      });
    }
  });

  res.header("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(Informations));

  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }

});

app.post('/:user/recom', function(req, res, err) {
  var user = req.params.user;
  var obj = require("./Profile.json");
  var folowObj = require("./Profile.json");
  var bookObj = require("./Book.json");
  var temp;
  var s1 = new Set();

  var Informations = {
    "status": "Ok",
    "Information": []
  };

  obj.Account.forEach(function(item) {
    if (item.userName == user) {
      item.fallowers.forEach(function(folow) {
        folowObj.Account.forEach(function(content) {
          if (folow == content.userName) {
            content.readingList.forEach(function(recom) {
              s1.add(recom);
            });
          }
        });
      });
    }
  });
  console.log(s1);
  s1.forEach(function(bookRecom) {
    bookObj.Book.forEach(function(book) {
      if (bookRecom == book.bookID) {
        temp = {
          "bookID": book.bookID,
          "title": book.title,
          "writer": book.writer,
          "translators": book.translators,
          "publication": book.publication,
          "dateOfPublication": book.dateOfPublication,
          "lang": book.lang

        }
        Informations.Information.push(temp);
      }

    });
  });

  res.header("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(Informations));

  if (err) {
    res.end(JSON.stringify("{'status':'Error'}"));
  }
});


module.exports = app;
