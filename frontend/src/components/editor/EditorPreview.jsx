import PropTypes from 'prop-types';
import React from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import EditorDiff from './EditorDiff';
import MDXPreview from './MDXPreview';
import { docusaurusBaseImages, htmlImages } from '../../helpers/diff';

const matter = require('front-matter');

/**
 * A wrapper for MDX renderer & editor diff
 */
const EditorPreview = ({
  file, previewOnly, content, from, to, docuId,
}) => {
  const contentMatter = matter(content);

  // MDX preprocessing for renderer
  let c = content.replace(/---.*---/s, '');

  c = c.replace(/\s*import.*docusaurus.*;/, '');

  c = docusaurusBaseImages(c);

  c = htmlImages(docuId, from, to, c);

  if (contentMatter.attributes.title) {
    c = `# Title: ${contentMatter.attributes.title}\n${c}`;
  }

  if (previewOnly) {
    return (
      <Tabs defaultActiveKey="preview" id="editortabs">
        <Tab eventKey="preview" title="Preview">
          <MDXPreview content={c} />
        </Tab>
      </Tabs>
    );
  }

  return (
    <Tabs defaultActiveKey="differences" id="editortabs">
      <Tab eventKey="preview" title="Preview">
        <MDXPreview content={c} />
      </Tab>
      <Tab eventKey="differences" title="Highlighted changes from proofreading request">
        <EditorDiff file={file} from={from} to={to} />
      </Tab>
    </Tabs>
  );
};

EditorPreview.defaultProps = {
  content: '',
  previewOnly: false,
  from: null,
  to: null,
};

EditorPreview.propTypes = {
  file: PropTypes.string.isRequired,
  content: PropTypes.string,
  from: PropTypes.string,
  to: PropTypes.string,
  previewOnly: PropTypes.bool,
  docuId: PropTypes.number.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuId: state.docuId,
  }
);

export default hot(module)(connect(mapStateToProps)(EditorPreview));
