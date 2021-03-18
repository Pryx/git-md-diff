import express from 'express'
import cors from 'cors';
import React from 'react'
import { renderToString } from 'react-dom/server'
import MDX from '@mdx-js/runtime'
import useBaseUrl from './baseurl'
import admonitions from 'remark-admonitions';

const app = express();

app.use(cors());
app.use(express.json());

//#endregion
app.post('/render', (req, res) => {
  const cont = req.body.content

  const components = {}
  const scope = {
    useBaseUrl
  }

  const plugins = [admonitions];

  try{
    const result = renderToString(
      <MDX children={cont} remarkPlugins={plugins} components={components} scope={scope}/>
    )
    res.send({rendered: result})
  } catch (error) {
    res.status(500).send({rendered: "Error rendering this page!", error: error.message})
  }
});

// Catchall
app.get('*', (req, res) => {
  res.status(404).send('Please use endpoints documented in the OpenAPI file');
});

export default app;