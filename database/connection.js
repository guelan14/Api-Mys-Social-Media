const mongoose = require("mongoose");
require("dotenv").config();

const connection = async () => {
  const url = process.env.DB_STRING;

  try {
    await mongoose.connect(url);
    console.log("conectado correctamente");
  } catch (error) {
    console.log(error);
    throw new error(" Conexion to DB failed");
  }
};

module.exports = connection;
