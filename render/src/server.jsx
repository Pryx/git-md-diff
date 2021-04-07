import MDX from '@mdx-js/runtime';
import cors from 'cors';
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import admonitions from 'remark-admonitions';

const app = express();

app.use(cors());
app.use(express.json());

// #endregion
app.post('/render', (req, res) => {
  const cont = req.body.content;

  const components = {};
  const scope = {
  };

  const plugins = [admonitions];

  try {
    const result = renderToString(
      <MDX remarkPlugins={plugins} components={components} scope={scope}>{cont}</MDX>,
    );
    res.send({ rendered: result });
  } catch (error) {
    res.status(500).send({ rendered: 'Error rendering this page!', error: error.message });
  }
});

// Catchall
app.get('*', (req, res) => {
  res.send('Render server is running. Please use endpoints documented in the OpenAPI file');
});

export default app;
