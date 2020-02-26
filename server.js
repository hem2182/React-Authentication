// express is a very powerful node based library for creating API
const express = require('express');
// this will give us access to env variables automatically.
require('dotenv').config();

const jwt = require('express-jwt'); // Validate JWT and set req.user.
const jwksRsa = require('jwks-rsa'); // Retrive RSA keys from the JSON Web Key set (JWKS) endpoint.

const checkJwt = jwt({
    // Dynamically provide a signing key based on the kid in the header and
    // the signing keys provided by the jwks endpoint
    secret: jwksRsa.expressJwtSecret({
        cache: true,    // cache the signing key
        rateLimit: true,
        jwksRequestsPerMinute: 5, // prevent attackers from requesting more than 5 per minute.
        jwksUri: `https://${
            process.env.REACT_APP_AUTH0_DOMAIN
            }/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,

    // this must match the algorithm selected in the auth0 dashboard under your app's advance settings under auth0 tab.
    algorithms: ["RS256"]
});


const app = express();

app.get("/public", function (req, res) {
    res.json({
        message: "Hello from public API."
    })
})

app.get("/private", checkJwt, function (req, res) {
    res.json({
        message: "Hello from private API."
    })
})

app.listen(3001);
console.log("API server listening on " + process.env.REACT_APP_AUTH0_AUDIENCE);
