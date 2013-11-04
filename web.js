//var gzippo = require('gzippo');
var express = require('express');
var app = express();

app.use(express.logger('dev'));
app.use(express.static(process.env.PWD+"/dist"));
app.listen(process.env.PORT || 5000);