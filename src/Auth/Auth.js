import auth0 from 'auth0-js';

export default class Auth {
    constructor(history) {
        // we will pass a react router history so auth can perform redirects.
        this.history = history;
        this.userProfile = null;
        this.auth0 = new auth0.WebAuth({
            domain: process.env.REACT_APP_AUTH0_DOMAIN,
            clientID: process.env.REACT_APP_AUTH0_CLIENTID,
            redirectUri: process.env.REACT_APP_AUTH0_CALLBACK,
            responseType: "token id_token",
            scope: "openid profile email"
            // token is the access token so that user can make api calls
            // id_token is a JWT token to authenticate the user when they login.
        })
    }

    login = () => {
        // this will redirect to auth0 login page.
        this.auth0.authorize();
    }

    handleAuthentication = () => {
        this.auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                this.setSession(authResult);
                // this is a way to programatically tell react router that we want to route to a new URL.
                this.history.push("/");
            } else if (err) {
                this.history.push("/");
                alert(`Error: ${err.error}. Check the console for further details.`);
                console.log(err);
            }
        })
    }

    setSession = (authResult) => {
        // set the time that the access token will expire
        const expiresAt = JSON.stringify(authResult.expiresIn * 1000 + new Date().getTime());
        localStorage.setItem("access_token", authResult.accessToken);
        localStorage.setItem("id_token", authResult.idToken);
        localStorage.setItem("expires_at", expiresAt);
    }

    isAuthenticated() {
        const expiresAt = JSON.parse(localStorage.getItem("expires_at"));
        return new Date().getTime() < expiresAt;
    }

    logout = () => {
        // this is a soft logout. this is useful for single sign on scenarios, so your session
        // stays valid for other apps using the Auth0 tenant.

        //Auth0 checks your session cookie which is stored in your browser under your auth0 domain to determine that you are logged in.
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_token");
        localStorage.removeItem("expires_at");
        this.userProfile = null;
        //this.history.push("/");

        // to logout of the auth0 server as well for standalone applications, use below code.
        // uncomment the history line for SSO.
        this.auth0.logout({
            clientID: process.env.REACT_APP_AUTH0_CLIENTID,
            returnTo: "http://localhost:3000"
        })
    }

    getAccessToken = () => {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            throw new Error("No Access Token found.");
        }
        return accessToken;
    }

    getProfile = (cb) => {
        if (this.userProfile) return cb(this.userProfile);
        this.auth0.client.userInfo(this.getAccessToken(), (err, profile) => {
            if (profile) this.userProfile = profile;
            cb(profile, err);
        });
    }
}