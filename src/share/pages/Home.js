import React from "react";
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div onClick={ () => console.log("Hello") }>
      Home works
      <br />
      <Link to='/list'>to list</Link>
    </div>
  );
}

export default Home;
