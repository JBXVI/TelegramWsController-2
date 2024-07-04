const c = require("./Crypto")
require("dotenv").config()
const key = process.env.KEY;

console.log(JSON.parse(c.Decrypt("S9ARoHOTIWZN2epF6Hbtqh+a/KbkQv4Wh//EgQa2Z7t9/+w8tGMeUE0/BBDxXhSo",key)))