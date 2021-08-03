import React from 'react';
import express from 'express';
import Home from '../share/pages/Home';
import { renderToString } from 'react-dom/server';

const app = express();

app.use(express.static('public'));

app.listen(3008, () => console.log('app is running on localhost:3008 port'));

app.get('/', (req, res) => {
  const content = renderToString(<Home />);
  res.send(`
    <html>
      <head>
        <title>React SSR</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="client.bundle.js"></script>
      </body>
    </html>
  `);
});

export default app;