const express = require('express');
const dotenv = require('dotenv');
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

const cors = require('cors');
const postRoutes = require('./routes/postRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/posts', postRoutes);

module.exports = app;
