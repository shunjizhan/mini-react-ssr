import React, { useEffect } from "react";
import { connect } from 'react-redux';
import { fetchUser } from '../store/actions/user.actions';

export const loadData = store => {
  return store.dispatch(fetchUser());   // 返回promise，这样服务端调用以后就知道了什么时候拿到了数据
};

function List({ user, dispatch }) {
  // 这是在组件挂载之后才会触发的，所以服务端渲染返回的html里面是不会触发的。
  useEffect(() => {
    dispatch(fetchUser());
  }, []);
 
  return (
    <div>
      list page works
      <ul>
        {
          user.map(
            u => (<li key={ u.id }>{ u.name }</li>)
          )
        }
      </ul>
    </div>
  );
}

const mapStateToProps = state => ({ user: state.user });

export default connect(mapStateToProps)(List);
