import React from 'react';
import ReactDOM from 'react-dom';

import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import routes from "../share/routes";

import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import reducer from '../share/store/reducers/index';

const store = createStore(reducer, window.INITIAL_STATE, applyMiddleware(thunk));
const Routes = renderRoutes(routes);

const App = () => (
  <Provider store={ store }>
    <BrowserRouter>
      { Routes }
    </BrowserRouter>
  </Provider>
);

ReactDOM.hydrate(<App />, document.getElementById('root'));
