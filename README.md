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
// src.server.renderer.js
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
// src/client/index.js
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

## 7) 服务端Redux
这一点是SSR最复杂的一点，主要的难点就是SSR是没有浏览器环境的，不会调用js和生命周期之类的函数，它返回的是一个html+js的形式。所以客户端获取初次渲染的数据的函数是不会被调用的(比如componentDidMount()和useEffect里面获取的数据，在服务端是获取不到的），所以我们要在服务端单独加一层代码来处理初次渲染的数据，代替这些获取数据的生命周期函数来处理initial data。

### 设置redux
我们在收到请求的时候可以创建的一个store，然后传给renderer处理，renderer就可以跟客户端渲染一样，把App包装进一个有store的Provider里面。

### 服务端给store拿数据
上一步会发现有这样有一个问题，就是初次渲染的时候，服务端创建的store里面是空的，因为在List组件里面的副作用是组件挂载之后，由浏览器触发js来触发的。但是服务器node里面是不会触发的（就像不会触发event handler一样）。
```ts
// src/share/pages/List.js

// 这是在组件挂载之后才会触发的，所以服务端渲染返回的html里面是不会触发的。
useEffect(() => {
  dispatch(fetchUser());
}, []);
```

**解决办法**：
本来这些`拿数据的副作用`是在客户端浏览器通过js去调用的，那我们现在要从服务端让node直接调用它。
所以我们就把这些需要`拿数据的副作用`单独设置成一个函数`loadData()`，然后在服务端渲染的时候，在服务端调用，并且装进store里面。

简单来讲，就是把初次渲染时候，浏览器需要调用的副作用，都交给服务端来处理。

具体怎么把`loadData()` 传给服务端呢？我们可以把它放到路由的数据里面，这样服务端拿路由的时候就顺便这写函数拿到了。

```ts
// src/share/routes.js

import List, { loadData } from '../share/pages/List';

export default [{
  path: '/',
  component: Home,
  exact: true
}, {
  path: '/list',
  component: List,
  loadData,       // <== 把副作用函数传进来
}]
```

### 服务端和客户端同步
上一步做完，还会有最后一个问题，/List会报错

`Warning: Did not expect server HTML to contain a <li> in <ul>.`

这是因为客户端在初始状态下是没有数据的，初次渲染的时候就只有空的ul。但是服务端是先获取数据再渲染组件，所以初次渲染生成的是有li的ul。hydrate的时候发现两者不一样，所以给出警告。

**解决办法**：
让服务器获取到的数据回填给客户端，让客户端拥有初始数据，以实现两端同步。

具体实现：首先在服务端的renderer里给html加上另一个script，这个script把初始状态保存到`window.INITIAL_STATE`里面。

```ts
// src.server.renderer.js

// initStateScript 必须放在前面！！要先赋值给window.INITIAL_STATE,然后再hydration的时候会创建新的store，然后用window.INITIAL_STATE当做初始值
const initStateScript = `
  <script>
    window.INITIAL_STATE = ${JSON.stringify(initState)}
  </script>
`;
const hydrationScript = '<script src="client.bundle.js"></script>';

return `
  ...
    <body>
      <div id="root">${content}</div>
      ${initStateScript}
      ${hydrationScript}
    </body>
  ...
`
```

然后hydration的之前，就可以通过`window.INITIAL_STATE`拿到store的初始值，当做创建client store的初始值，这样就保证了和服务端的store初始state的同步。

```tsx
// src/client/index.js

const init_state_from_SSR = window.INITIAL_STATE;
const store = createStore(reducer, init_state_from_SSR, applyMiddleware(thunk));

const App = () => (
  <Provider store={ store }>
    ...
  </Provider>
);

ReactDOM.hydrate(<App />, document.getElementById('root'));
```

在server里面也要稍微修改，因为现在服务端需要调用异步副作用代码获取数据，那就改成异步代码，等获取好数据了再返回结果给客户端。

```ts
app.get('*', async (req, res) => {
  ...

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
```

## 8) 防止XSS攻击
如果返回的结果是这样,存储在store中
```ts
const response = {
  data: [
    {
      id: 1,
      name: "</script><script>alert(1)</script>"
    }
  ]
};
```
执行的时候就发现在浏览器弹出了alert(1)

为了防止XSS，我们需要用到转译，把恶意代码sanitize一下。可以直接用到这个库，用serialize()代替JSON.stringify()
```ts
import serialize from 'serialize-javascript';
...

const initStateScript = `
  <script>
    window.INITIAL_STATE = ${serialize(initState)}
  </script>
`;
```

## 总结
- 基本结构：
  - 首先在服务端生成html，然后发回给客户端，并挂上一个注水的script给这个html
  - 客户端收到html会运行注水script，这script内部调用ReactDOM.hydrate()给客户端注水，激活所有浏览器相关的功能，比如event handler
- 处理路由：用到一个shared的路由config
  - 服务端服务器设置，不管什么path，都交给renderer处理。renderer渲染路由config，将app包进StaticRouter路由并设置location跳到相应界面。
  - 客户端类似，也是将app包进BrowserRouter路由就行了
- 处理redux
  - 服务端因为不能运行副作用，比如useEffect中loadData()获取数据，所以要专门把loadData函数通过路由传给express，express直接调用并获取数据，装进redux里面，再渲染页面。同时，为了跟客户端的redux同步，还要多设置一个script，把初始的state保存在window上。其实就是把整个state传过来了。
  - 客户端直接用传过来的初始state，创建redux，并渲染界面，保证了初始数据的同步。
- 防止XSS攻击：`window.INITIAL_STATE = ${serialize(initState)}`
