// express is a very powerful node based library for creating API
const express = require('express');
// this will give us access to env variables automatically.
require('dotenv').config();

const jwt = require('express-jwt'); // Validate JWT and set req.user.
const jwksRsa = require('jwks-rsa'); // Retrieve RSA keys from the JSON Web Key set (JWKS) endpoint.
const checkScope = require('express-jwt-authz');    // Validates JWT scopes.

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

function checkRole(role) {
    return function (req, res, next) {
        const assignedRoles = req.user["http://localhost:3000/roles"];
        if (Array.isArray(assignedRoles) && assignedRoles.includes(role)) {
            return next();
        } else {
            return res.status(401).send("Insufficient Role");
        }
    };
}

app.get("/admin", checkJwt, checkRole('admin'), function (req, res) {
    res.json({
        message: "Hello from Admin API."
    })
})

app.get("/course", checkJwt, checkScope(["read:courses"]), function (req, res) {
    res.json({
        courses: [
            { id: 1, title: "Building Apps with React and Redux" },
            { id: 2, title: "Creating Reusable React Components" }
        ]
    })
})

app.listen(3001);
console.log("API server listening on " + process.env.REACT_APP_AUTH0_AUDIENCE);
