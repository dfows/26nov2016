function viewThis(fn) {
  return function(args) {
    return '<html>' +
      '<head>' +
        '<meta http-equiv="Content-Type" content="text/html" charset=UTF-8 />' +
        '<title>why the fuck am i doing this-- seriously, why</title>' +
      '</head>' +
      '<body>' +
        '<div>' +
          fn(args) +
        '</div>' +
      '</body>' +
    '</html>';
  };
}
function home(args) {
  // it might be time to use an actual templating language
  if (args) {
    // lol rly i'm gonna use this as a check for whether or not i'm logged in?
    // well i'm not using an actual fucking templating language so i guess quality is not a concern here
    return '<p>you are logged in as ' + args.user.username + '</p>' +
      '<a href="/editor">create new post</a>' +
      '<form action="/logout" method="post">' +
        '<input type=submit value="log out" />' +
      '</form>' +
      displayPosts(args.posts, true);
  } else {
    return '<p>welcome to this terrible node practice project</p>' +
      '<a href="/login">log in</a>' +
      '<br />' +
      '<a href="/signup">sign up</a>';
  }
}

function publicBlog(args) {
  return '<a href="/">Home</a>' +
    '<h1>The Blog of ' + args.username + '</h1>' +
    displayPosts(args.posts, args.editable);
}

function editor() {
  return '<p>Create new post</p>' +
  '<form action="/post" method="post">' +
    '<input name="title" type="text" placeholder="Post Title" />' +
    '<br />' +
    '<textarea name="content" placeholder="Post Content"></textarea>' +
    '<br />' +
    '<input type="submit" value="create post" />' +
  '</form>';
}

function editExisting(post) {
  return '<p>Edit this post</p>' +
  '<form action="/post/' + post.id + '" method="post">' +
    '<input name="_method" type="hidden" value="patch" />' +
    '<input name="title" type="text" placeholder="Post Title"' +
      'value="' + post.title + '" />' +
    '<br />' +
    '<textarea name="content" placeholder="Post Content">' +
      post.content +
    '</textarea>' +
    '<br />' +
    // if i weren't such a sack of shit i'd add an option to update the timestamp
    '<input type="submit" value="save changes" />' +
  '</form>' +
  '<form action="/post/' + post.id + '" method="post">' +
    '<input name="_method" type="hidden" value="delete" />' +
    '<input type="submit" value="delete this post" />' +
  '</form>';
}

function displayPosts(posts, editable) {
  var display = posts.map(function(p) {
    var edit = editable ? '<a href="/editor/' + p.id + '">Edit Post</a>' : '';
    return '<div class="post">' +
      edit +
      '<h2 class="title">' + p.title + '</h2>' +
      '<p class="date">' + p.date + '</p>' +
      '<p>' + p.content + '</p>' +
    '</div>';
  });
  return '<div class="posts">' +
    display.join('') +
  '</div>';
}

function signUp() {
  return '<p>Sign up for a new account (or <a href="/login">log in to an existing account</a>)</p>' +
  '<form action="/signup" method="post">' +
    '<input name="humanName" type="text" placeholder="human name" />' +
    '<input name="user" type="text" placeholder="username" />' +
    '<input name="pass" type="password" placeholder="password" />' +
    '<input type="submit" value="sign up"/>';
  '</form>';
}

function logIn() {
  return '<p>Log in to an existing account (or <a href="/signup">sign up for a new account</a>)</p>' +
  '<form action="/login" method="post">' +
    '<input name="user" type="text" placeholder="username" />' +
    '<input name="pass" type="password" placeholder="password" />' +
    '<input type="submit" value="log in"/>';
  '</form>';
}

function badLogin() {
  return '<p>Bad login. <a href="/login">Go back and try again</a>.</p>';
}

function usernameTaken(args) {
  return '<p>The username "' + args.username + '" is in use. <a href="/signup">Go back and choose another</a>.</p>';
}

// in case i feel like making this less disgusting; prolly not tho
exports.logged_in_home = viewThis(home);
exports.logged_out_home = viewThis(home);

exports.public_blog = viewThis(publicBlog);
exports.editor = viewThis(editor);
exports.edit_existing = viewThis(editExisting);

exports.log_in = viewThis(logIn);
exports.sign_up = viewThis(signUp);
exports.bad_login = viewThis(badLogin);
exports.username_taken = viewThis(usernameTaken);
