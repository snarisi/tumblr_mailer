var ejs = require('ejs');

var template = 'Hi, my name is <%= name %>. The best movie ever is <%= favoriteMovie %>.'

var renderedText = ejs.render(template, { name: 'Alice Cooper', favoriteMovie: 'Welcome to My Nightmare'});
console.log(renderedText);