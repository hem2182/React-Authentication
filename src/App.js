import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import Nav from './Nav';
import Home from './Home';
import Profile from './Profile';
import Auth from './Auth/Auth';
import Callback from './Callback';
import Public from './Public';
import Private from './Private';
import Courses from './Courses';
import PrivateRoute from './PrivateRoute';
import AuthContext from './AuthContext';

class App extends Component {
  constructor(props) {
    super(props);
    // this.auth = new Auth(this.props.history);
    this.state = {
      auth: new Auth(this.props.history),
      tokenRenewalComplete: false
    }
  }

  componentDidMount() {
    this.state.auth.renewToken(() => {
      this.setState({ tokenRenewalComplete: true });
    });
  }

  render() {
    const { auth } = this.state;
    // Show loading message until the token renewal is complete.
    if (!this.state.tokenRenewalComplete) return "Loading...";
    return (
      // this is a short hand for React.Fragment "<>"
      <AuthContext.Provider value={auth}>
        <Nav auth={auth} />
        <div className="body">
          <Route path="/" exact render={props => <Home auth={auth} {...props} />} />
          <Route path="/callback" render={props => <Callback auth={auth} {...props} />} />
          <PrivateRoute path="/profile" component={Profile} />
          <Route path="/public" component={Public} />
          <PrivateRoute path="/private" component={Private} />
          <PrivateRoute path="/courses" component={Courses} scopes={["read:courses"]} />
        </div>
      </AuthContext.Provider>
    )
  }
}

export default App;
