import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderRoutes } from 'react-router-config';
import { StaticRouter } from 'react-router-dom';
import routes from '../share/routes';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';

const renderer = (req, store) => {
  const Routes = renderRoutes(routes);    // 把routes配置转换成组件element形式

  const App = () => (
    <Provider store={ store }>
      <StaticRouter location={ req.path }>
        { Routes }
      </StaticRouter>
    </Provider>
  );
  const content = renderToString(<App/>);
  const initState = store.getState();

  // initStateScript 必须放在前面！！要先赋值给window.INITIAL_STATE,然后再hydration的时候会创建新的store，然后用window.INITIAL_STATE当做初始值
  const initStateScript = `
    <script>
      window.INITIAL_STATE = ${serialize(initState)}
    </script>
  `;
  const hydrationScript = '<script src="client.bundle.js"></script>';

  return `
    <html>
      <head>
        <title>React SSR</title>
      </head>
      <body>
        <div id="root">${content}</div>
        ${initStateScript}
        ${hydrationScript}
      </body>
    </html>
  `
};

export default renderer;