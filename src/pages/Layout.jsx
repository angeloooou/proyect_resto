/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import Nav from '../components/Nav';
import Header from '../components/Header';
import Body from '../components/Body';

const Layout = () => {

  return (
  <div>
    <div>
    <Nav></Nav>
    </div>
    <div>
    <Header></Header>
    </div>
    <div>
    <Body></Body>
    </div>
    <div>

    </div>
  </div>
  )
}

export default Layout