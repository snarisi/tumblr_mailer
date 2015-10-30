var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('yTnGcKumxKkodZJ6Uy4Yrw');
var api_keys = require('./api_keys');

var client = tumblr.createClient({
  consumer_key: api_keys.consumer_key,
  consumer_secret: api_keys.consumer_secret,
  token: api_keys.token,
  token_secret: api_keys.token_secret
});

var csvFile = fs.readFileSync('friend_list.csv', 'utf8'),
  emailTemplate = fs.readFileSync('email_template.html.ejs', 'utf8');

//parse csv file containing contacts
function csvParse(data) {
  data = data.split('\n');

  var parsedData = [],
    key = data.shift().split(','),
    newEntry;
  
  data.forEach(function(row) {
    newEntry = {};
    row = row.split(',');
    
    for (var i = 0; i < key.length; i++) {
      newEntry[key[i]] = row[i];
    }
    parsedData.push(newEntry);
  });
  return parsedData;
}

//pull title and url for all tumblr posts published in the past 7 days
function getRecentPosts(posts) {
  var latestPosts = [],
    newPost,
    now = new Date().getTime();
  
  posts.forEach(function(post) {
    if (now - new Date().getTime(post.date) < 604800000) {
      newPost = {
        title: post.title,
        href: post.post_url
      };
      latestPosts.push(newPost);      
    }
  });
  return latestPosts;
}

//send email using mandrill api
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
  var message = {
      "html": message_html,
      "subject": subject,
      "from_email": from_email,
      "from_name": from_name,
      "to": [{
              "email": to_email,
              "name": to_name
          }],
      "important": false,
      "track_opens": true,    
      "auto_html": false,
      "preserve_recipients": true,
      "merge": false,
      "tags": [
          "Fullstack_Tumblrmailer_Workshop"
      ]    
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
      console.log(message);
      console.log(result);   
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
}

//render and send the customized email for each contact
function renderAndSendEmails(contactsObj, postsObj) {
  var customizedHtml;
  
  contactsObj.forEach(function(contact) {
    customizedHtml = ejs.render(emailTemplate, {
      firstName: contact.firstName,
      numMonthsSinceContact: contact.numMonthsSinceContact,
      latestPosts: postsObj
    });
    sendEmail(contact.firstName + ' ' + contact.lastName, contact.emailAddress, 'Sam Narisi', 'snarisi@gmail.com', 'Hi!', customizedHtml);
  });
}

//get data from tumblr, insert values into html and send emails
client.posts('samnarisi.tumblr.com', function(err, blog) {
  var latestPosts = getRecentPosts(blog.posts),
    contacts = csvParse(csvFile);
  renderAndSendEmails(contacts, latestPosts);
});