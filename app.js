// another motherfucking blog/auth project
var killMeNow = process.env.PORT || 8888;

var viewz = require('./views');
var db = require('./db');

var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('client-sessions');
var bcrypt = require('bcrypt');
var saltRounds = 10;

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false})); // i still have no fucking idea what this is 
app.use(session({
  cookieName: 'session',
  secret: 'do i even need this',
  duration: 1800000,
  activeDuration: 300000
}));
app.use(methodOverride(function(req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.get('/posts/:username', function(req, res) {
  var usr = req.params.username;
  var you = validSession(req) && req.session.user.username === usr;
  db.qq('SELECT id FROM userz WHERE username = $1', [req.params.username], function(err, result) {
    if (result.rows.length < 1) {
      res.redirect('/404'); //lol..... jank
    } else {
      // query the db for the posts depending on the user id
      getPosts(result.rows[0].id, function(posts) {
        var obj = {
          username: usr,
          posts: posts,
          editable: you
        };
        res.send(viewz.public_blog(obj));
      });
    }
  });
});

app.get('/posts', function(req, res) {
  // this will redirect to your fucking page if you are logged in
  // otherwise it will go to the login page because /posts goes nowhere
  if (!validSession(req)) {
    res.redirect('/login');
  } else {
    res.redirect('/posts/'+req.session.user.username);
  }
});

// k let's pretend no one will ever access this via some other way
app.get('/editor/:postId', function(req, res) {
  if (!validSession(req) ||
      !isItYourPost(req.session.user.userId, req.params.postId)) {
    // you should never get to this point if not logged in and trying to edit your own posts. so i will 404 ur ass
    res.redirect('/404'); //404s arent even supposed to be used this way. i know that. you think i don't know that? IT'S 1AM WTF
  } else {
    db.qq('SELECT * FROM postz WHERE id = $1', [req.params.postId], function(err, result) {
      if (result.rows.length < 1) {
        res.redirect('/404'); // ugh i want to put in an actual error template
      } else {
        var obj = result.rows[0];
        res.send(viewz.edit_existing(obj));
      }
    });
  }
});

app.patch('/post/:postId', function(req, res) {
  if (!validSession(req) ||
      !isItYourPost(req.session.user.userId, req.params.postId)) {
    // there has to be a fucking way to cut down on this
    res.redirect('/404'); // once again u should not be patching this page
  } else {
    var data = req.body;
    db.qq('UPDATE postz SET title = $2, content = $3 WHERE id = $1', [req.params.postId, data.title, data.content], function(err, result) {
      // i'm not fucking returning this shit
      res.redirect('/posts/' + req.session.user.username); // well we fucking know ur logged in. or at least i hope so... HAHAHHAHAH fu
      // but also if i weren't such a sack of shit this would redirect to wherever you came from, which is totally a thing i could save somewhere and refer to BUT NO
    });
  }
});

app.delete('/post/:postId', function(req, res) {
  if (!validSession(req) ||
      !isItYourPost(req.session.user.userId, req.params.postId)) {
    res.redirect('/404'); //ditto @ access
  } else {
    db.qq('DELETE FROM postz WHERE id = $1', [req.params.postId], function(err, result) {
      res.redirect('/posts/' + req.session.user.username); // ditto @ redirect properly but no
    });
  }
});


app.get('/signup', function(req, res) {
  if (validSession(req)) {
    res.redirect('/dashboard');
  } else {
    res.send(viewz.sign_up());
  }
});

app.post('/signup', function(req, res) {
  var data = req.body;
  // query db with insert new account
  // do all that fucking bullshit
  db.qq('SELECT username FROM userz WHERE username = $1 LIMIT 1', [data.user], function(err, record) {
    if (record.rows.length > 0) {
      res.send(viewz.username_taken(data.user));
    } else {
      bcrypt.hash(data.pass, saltRounds, function(err, hash) {
        db.qq('INSERT INTO userz (username, password, humanName) VALUES ($1, $2, $3) RETURNING id, username, humanName', [data.user, hash, data.humanName], function(err, newRecord) {
          var user = newRecord.rows[0];
          var now = new Date().toString();
          req.session.user = {
            userId: user.id, // fuck you i'm saving this cuz do you think i want to look it up every goddamn time i need to req some shit via foreign key. no
            username: user.username,
            humanName: user.humanname, // wow i would hate myself if i had to maintain this code LMFAO good thing i don't HAHAHHAAH fuck you
            loggedInAt: now
          };
          res.redirect('/dashboard');
        });
      });
    }
  });
});

app.get('/login', function(req, res) {
  // where ur bitch ass sees the login panel
  if (validSession(req)) {
    // don't fuck with me
    res.redirect('/dashboard');
  } else {
    res.send(viewz.log_in());
  }
});

app.post('/login', function(req, res) {
  var data = req.body;
  // query db and check that ur credentials are all good
  db.qq('SELECT id, username, password, humanName FROM userz WHERE username = $1', [data.user], function(err, records) {
    if (records.rows.length < 1) {
      res.send(viewz.bad_login()); // bad username
    } else {
      var user = records.rows[0];
      bcrypt.compare(data.pass, user.password, function(err, check) {
        if (!check) {
          res.send(viewz.bad_login()); // bad pass
        } else {
          var now = new Date().toString();
          req.session.user = {
            userId: user.id,
            username: user.username,
            humanName: user.humanname, // wow i would hate myself if i had to maintain this code LMFAO good thing i don't HAHAHHAAH fuck you
            loggedInAt: now
          };
          res.redirect('/dashboard');
        }
      });
    }
  });
});

app.post('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

app.all('/dashboard', function(req, res) {
  getPosts(req.session.user.userId, function(posts) {
    var obj = {
      user: req.session.user,
      posts: posts
    };
    res.send(viewz.logged_in_home(obj));
  });
});

app.get('/editor', function(req, res) {
  if (!validSession(req)) {
    res.redirect('/login');
  } else {
    res.send(viewz.editor());
  }
});

app.post('/post', function(req, res) {
  var data = req.body;
  if (!validSession(req)) {
    res.redirect('/login');
  } else {
    db.qq('INSERT INTO postz (title, content, author) VALUES ($1, $2, $3)', [data.title, data.content, req.session.user.userId], function(err, result) {
      if (err) {
        // frankly i dont care
      } else {
        res.redirect('/dashboard');
      }
    });
  }
});

app.all('/', function(req, res) {
  if (!validSession(req)) {
    res.send(viewz.logged_out_home());
  } else {
    res.redirect('/dashboard');
  }
});

app.use(function(req, res) {
  res.status(404).send("this is a 404");
});

function getPosts(userId, callback) {
  db.qq('SELECT id, title, date, content FROM postz WHERE author = $1 ORDER BY id DESC', [userId], function(err, result) {
    callback(result.rows);
  });
}

function validSession(req) {
  var magicFuckingSessionDuration = 30*60*1000; // thirty fucking minutes
  if (!req.session || !req.session.user) {
    return false;
  } else {
    var now = new Date();
    var then = new Date(req.session.user.loggedInAt); // this will be a thing if u have req.session.user
    return (now - then) < magicFuckingSessionDuration;
  }
}

function isItYourPost(uId, pId) {
  db.qq('SELECT author FROM postz WHERE id = $1', [pId], function(err, result) {
    return result.rows[0].author == uId;
  });
}

app.listen(killMeNow);
