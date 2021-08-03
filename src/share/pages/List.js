import React, { useEffect } from "react";
import { connect } from 'react-redux';
import { fetchUser } from '../store/actions/user.actions';

function List({ user, dispatch }) {
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
