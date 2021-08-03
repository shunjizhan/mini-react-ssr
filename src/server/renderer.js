import React from 'react';
import Home from '../share/pages/Home';
import { renderToString } from 'react-dom/server';

const renderer = () => {
  const content = renderToString(<Home />);

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