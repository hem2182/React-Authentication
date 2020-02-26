import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import Nav from './Nav';
import Home from './Home';
import Profile from './Profile';
import Auth from './Auth/Auth';
import Callback from './Callback';
import Public from './Public';
import Private from './Private';

class App extends Component {
  constructor(props) {
    super(props);
    this.auth = new Auth(this.props.history);
  }

  render() {
    return (
      // this is a short hand for React.Fragment
      <>
        <Nav auth={this.auth} />
        <div className="body">
          <Route path="/" exact render={props => <Home auth={this.auth} {...props} />} />
          <Route path="/callback" render={props => <Callback auth={this.auth} {...props} />} />
          <Route
            path="/profile"
            render={props => this.auth.isAuthenticated() ?
              (<Profile auth={this.auth} {...props} component={Profile} />) :
              (<Redirect to="/"></Redirect>)
            } />
          <Route path="/public" component={Public} />
          <Route path="/private" render={props => this.auth.isAuthenticated() ? (<Private auth={this.auth} {...props} />) : this.auth.login()} />
        </div>
      </>
    )
  }
}

export default App;
