const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const bcrypt = require("bcrypt");
const databasePath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at https://localost/3000/")
    );
  } catch (error) {
    console.log(`error message is ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkingUserQuery = `SELECT * FROM user WHERE username='${username}';`;

  const userDb = await db.get(checkingUserQuery);

  if (userDb === undefined) {
    const uploadingUser = `
      INSERT INTO user(username,name,password,gender,location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    if (password.length > 4) {
      await db.run(uploadingUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//api 2 login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkingUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const userDb = await db.get(checkingUserQuery);
  if (userDb === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparingPassword = await bcrypt.compare(password, userDb.password);
    if (comparingPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//api 3 put
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  //here we have to check the username in data base and verify corresponding password
  const gettingCorrectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const gettingCorrectUser = await db.get(gettingCorrectUserQuery);
  if (gettingCorrectUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(
      oldPassword,
      gettingCorrectUser.password
    );
    if (comparePassword === true) {
      if (newPassword.length > 4) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE 
                user 
            SET 
                password='${hashedNewPassword}' 
            WHERE 
                username='${username}';`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
