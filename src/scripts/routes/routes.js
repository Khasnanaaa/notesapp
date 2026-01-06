import Home from '../pages/home/index';
import Login from '../pages/login/index';
import Register from '../pages/register/index';
import AddStory from '../pages/add/index'; 
import Favorites from '../pages/favorites/index.js';
import Detail from '../pages/detail/index';

const routes = {
  '/': Home,       // URL: http://.../
  '/login': Login,     // URL: http://.../#/login
  '/register': Register, // URL: http://.../#/register
  '/add': AddStory,    // URL: http://.../#/add
  '/favorites': Favorites,
  '/stories/:id': Detail, // Menggunakan URL Parser pattern
};

export default routes;