import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from '../App.jsx';

// Register the app
AppRegistry.registerComponent('App', () => App);

// Mount the application
const rootTag = document.getElementById('root');

if (rootTag) {
  AppRegistry.runApplication('App', {
    initialProps: {},
    rootTag: rootTag,
  });
} else {
  document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:20%">Error: #root element not found</h1>';
}
