import Home from '../share/pages/Home';
import List, { loadData } from '../share/pages/List';

export default [{
  path: '/',
  component: Home,
  exact: true
}, {
  path: '/list',
  component: List,
  loadData,
}]