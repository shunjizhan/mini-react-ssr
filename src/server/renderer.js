import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderRoutes } from 'react-router-config';
import { StaticRouter } from 'react-router-dom';
import routes from '../share/routes';

const renderer = req => {
  const Routes = renderRoutes(routes);    // 把routes配置转换成组件element形式
  const content = renderToString(
    <StaticRouter
      location={ req.path }
    >
      { Routes }
    </StaticRouter>
  );

  return `
    <html>
      <head>
        <title>React SSR</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="client.bundle.js"></script>
      </body>
    </html>
  `
};

export default renderer;