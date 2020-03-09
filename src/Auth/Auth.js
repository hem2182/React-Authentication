import auth0 from 'auth0-js';

const REDIRECT_ON_LOGIN = "redirect_on_login";

// Store outside class since private variables.
// eslint-disable-next-line no-unused-vars
let _idToken = null;
let _accessToken = null;
let _scopes = null;
let _expiresAt = null;


export default class Auth {
    constructor(history) {
        // we will pass a react router history so auth can perform redirects.
        this.history = history;
        this.userProfile = null;
        this.requestedScopes = "openid profile email read:courses";
        this.auth0 = new auth0.WebAuth({
            domain: process.env.REACT_APP_AUTH0_DOMAIN,
            clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
            redirectUri: process.env.REACT_APP_AUTH0_CALLBACK,
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            responseType: "token id_token",
            scope: this.requestedScopes
            // token is the access token so that user can make api calls
            // id_token is a JWT token to authenticate the user when they login.
        })
    }

    login = () => {
        localStorage.setItem(REDIRECT_ON_LOGIN, JSON.stringify(this.history.location));
        // this will redirect to auth0 login page.
        this.auth0.authorize();
    }

    handleAuthentication = () => {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
                const redirectLocation = localStorage.getItem(REDIRECT_ON_LOGIN) === "undefined" || localStorage.getItem(REDIRECT_ON_LOGIN) === null ? "/" : JSON.parse(localStorage.getItem(REDIRECT_ON_LOGIN));
                // this is a way to programmatically tell react router that we want to route to a new URL.
                this.history.push(redirectLocation);
            } else if (err) {
                this.history.push("/");
                alert(`Error: ${err.error}. Check the console for further details.`);
                console.log(err);
            }
        })
        localStorage.removeItem(REDIRECT_ON_LOGIN);
    }

    setSession = (authResult) => {
        // if there is a value on the scope param for the authResult,
        // use it to set scope for the user in the session. otherwise,
        // use the scopes as requested. if no scopes were requested, set it to nothing.
        _scopes = authResult.scope || this.requestedScopes || '';

        // set the time that the access token will expire
        _expiresAt = authResult.expiresIn * 1000 + new Date().getTime();
        _accessToken = authResult.accessToken;
        _idToken = authResult.idToken;

        this.scheduleTokenRenewal();
    }

    isAuthenticated() {
        return new Date().getTime() < _expiresAt;
    }

    logout = () => {
        // to logout of the auth0 server as well for standalone applications, use below code.
        // uncomment the history line for SSO.
        this.auth0.logout({
            clientID: process.env.REACT_APP_AUTH0_CLIENT_ID,
            returnTo: "http://localhost:3000"
        })
    }

    getAccessToken = () => {
        if (!_accessToken) {
            throw new Error("No Access Token found.");
        }
        return _accessToken;
    }

    getProfile = (cb) => {
        if (this.userProfile) return cb(this.userProfile);
        this.auth0.client.userInfo(this.getAccessToken(), (err, profile) => {
            if (profile) this.userProfile = profile;
            cb(profile, err);
        });
    }

    userHasScopes(scopes) {
        const grantedScopes = (_scopes || "").split(" ");
        return scopes.every(scope => grantedScopes.includes(scope));
    }

    renewToken(cb) {
        this.auth0.checkSession({}, (err, result) => {
            if (err) {
                console.log(`Error: ${err.error} - ${err.errorDescription}.`);
            } else {
                this.setSession(result);
            }
            if (cb) cb(err, result);
        });
    }

    scheduleTokenRenewal() {
        const delay = _expiresAt - Date.now();
        if (delay > 0) setTimeout(() => this.renewToken(), delay);
    }
}