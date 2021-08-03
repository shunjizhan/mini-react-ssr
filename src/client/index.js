import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import routes from "../share/routes";

const Routes = renderRoutes(routes);
const App = () => (
  <BrowserRouter>
    { Routes }
  </BrowserRouter>
);
ReactDOM.hydrate(<App />, document.getElementById('root'));
