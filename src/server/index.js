import express from 'express';
import renderer from './renderer';

const app = express();

app.use(express.static('public'));

app.listen(3008, () => console.log('app is running on localhost:3008 port'));

app.get('*', (req, res) => {
  res.send(renderer(req));
});

export default app;