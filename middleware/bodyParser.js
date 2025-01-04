const bodyParser = require("body-parser");
const express = require("express");

module.exports = (app) => {
  app.use(express.json());
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
};
