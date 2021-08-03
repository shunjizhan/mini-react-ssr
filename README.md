# Mini React SSR
实现一个简易版的React SSR

src
  - client（客户端渲染相关）
  - server（服务端渲染相关）
  - share（通用的）

## 1) 服务端渲染
主要就是用到了react-dom的renderToString方法，把一个组件渲染成jsx,然后插进html里面，服务端就可以直接返回这个html。

```ts
// src/server/index.js
app.get('/', (req, res) => {
  const content = renderToString(<Home />);
  res.send(`
    <html>
      <head>
        <title>React SSR</title>
      </head>
      <body>
        <div id="root">${content}</div>
      </body>
    </html>
  `);
});
```

把server.js是不能直接运行的，因为node不能理解jsx，所以用webpack打包成server.bundle.js,然后`node server.bundle.js`就可以在localhost里面看到Home的内容了。

但是这个时候我们会发现，event handler是没用的，这时候app里面只有html，没有js，自然就没有event handler。我们需要继续对组件进行二次渲染（hydrate）来激活界面。

## 2) Hydrate注水
hydration本身的代码本简单，就是重新render一次组件，只不过把render换成了hydrate。

为什么不用render而用hydrate？因为hydrate方法在实现渲染的时候, 会复用原本已经存在的 DOM 节点 , 减少重新生成节点以及删除原本 DOM 节点的开销。

 ```ts
 // src/client/index.js
 ReactDOM.hydrate(<Home />, document.getElementById('root'));
 ```

运行这段代码就能实现注水，那怎么运行呢？很简单，首先是要打包到public/client.bundle.js,然后在server返回的html里面加上一个script调用这段注水代码就行了。

这个script在第一次服务端渲染返回html的时候是不会运行的，直到第二次渲染注水的时候才会运行。

```ts
// src/server/index.js
app.use(express.static('public'));    // client.bundle.js会直接在public/里面找

app.get('/', (req, res) => {
  const content = renderToString(<Home />);
  res.send(`
    ...
      <div id="root">${content}</div>
      <script src="client.bundle.js"></script>
    ...
  `);
});
```

## 3) 代码重构
提取出一个renderer函授，专门用来创建html

## 4) 服务端路由
在React SSR 项目中需要实现两端路由:
- 客户端路由是用于支持用户通过点击链接的形式跳转页面
- 服务器端路由是用于支持用户直接从浏览器地址栏中访问页面
- 客户端和服务器端公用一套路由规则,所以路由规则放在share/里面

服务端路由首先是在server里面，不管拿到什么路径req.path，统一交给renderer处理，
```ts
// src/server/index.js
app.get('*', (req, res) => {
  res.send(renderer(req));
});
```

renderer用到了两个helper `renderRoutes` 和`StaticRouter`实现,拿到path以后把path传进StaticRouter里面，渲染出对应的界面。renderRoutes则是把路由配置渲染成react element形式，才能直接用。

```tsx
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
```

**注意**
Routes是组件element形式，而不是一个class或者函数，它编译过后就是vdom了：
```ts
{
  '$$typeof': Symbol(react.element),
  type: [Function: Switch] {
    propTypes: { children: [Function], location: [Function] }
  },
  key: null,
  ref: null,
  props: { children: [ [Object], [Object] ] },
  _owner: null,
  _store: {}
}
```
其实就跟`const Test = (<div></div>)`的类型是一样的。而不是`const Test () => (<div></div>);`

所以调用的时候是直接当然element放进jsx里面,这样**不会调用**组件的创建函数 (它本身就是jsx element，已经是调用创建函数render()的结果了)
```tsx
<StaticRouter>
  { Routes }
</StaticRouter>
```

而不是这样（这是函数或者class组件的调用形式），**会调用**组件的创建函数 
```tsx
<StaticRouter>
  <Routes />
</StaticRouter>
```

**注意2**
这个时候访问/list会发现list page一闪而过，又回到了home。因为我们还没处理客户端注水，之前的注水渲染了home，所以会跳回去。

## 5) 客户端路由
客户端路由其实很直接，就是把客户端代码包装进Router，然后把routes渲染成element放进去就行了。
```tsx
// src/client/index.js
const Routes = renderRoutes(routes);
const App = () => (
  <BrowserRouter>
    { Routes }
  </BrowserRouter>
);
ReactDOM.hydrate(<App />, document.getElementById('root'));
```

## 6) 客户端Redux
客户端也就是正常创建一个redux结构（reducer和actions），然后把App包装进一个Provider里面。因为客户端本身就是这么做的，所以也没什么特别不一样的。

```tsx
const store = createStore(reducer, {}, applyMiddleware(thunk));
const Routes = renderRoutes(routes);

const App = () => (
  <Provider store={ store }>
    <BrowserRouter>
      { Routes }
    </BrowserRouter>
  </Provider>
);
```

**注意**
浏览器原生是不支持异步函数的，需要在webpack里面要给babel配置一个polyfill就可以了。
```ts
presets: [
  [
    "@babel/preset-env",
    {
      useBuiltIns: "usage"    // polyfill异步执行的代码
    }
  ],
  "@babel/preset-react"
]
```