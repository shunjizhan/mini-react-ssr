import express from 'express';
import renderer from './renderer';

import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import reducer from '../share/store/reducers/index';

import { matchRoutes } from 'react-router-config';
import routes from '../share/routes';

const app = express();

app.use(express.static('public'));

app.listen(3008, () => console.log('app is running on localhost:3008 port'));

app.get('*', async (req, res) => {
  // store是在接收到请求的时候才创建的
  const store = createStore(reducer, {}, applyMiddleware(thunk))

  // 根据请求地址匹配出要渲染组建的路由信息（这里面存了loadData）
  const pendingLoads = matchRoutes(routes, req.path).map(({ route }) => {
    const { loadData } = route;
    if (loadData) return loadData(store);
  });

  // 等数据获取好了以后再发送结果给客户端
  Promise.all(pendingLoads).then(() => {
    res.send(renderer(req, store));
  });
});

export default app;