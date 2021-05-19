import ky from 'ky';
import PropTypes from 'prop-types';
import React from 'react';
import { Alert } from 'react-bootstrap';
import { hot } from 'react-hot-loader';

/**
 * The MDX renderer
 */
class MDXPreview extends React.Component {
  state = {
    isLoaded: false,
    rendered: '',
  };

  /**
   * Render on mount
   */
  componentDidMount() {
    const { content } = this.props;
    this.getRenderedContent(content);
  }

  /**
   * Re-render on update
   */
  componentDidUpdate(prev) {
    const { content } = this.props;
    if (content !== prev.content) {
      this.getRenderedContent(content);
    }
  }

  /**
   * Get rendered content from server
   * @param {string} content The content
   */
  async getRenderedContent(content) {
    const response = await ky.post(`${window.env.api.render}/render`, { json: { content } });
    const ajax = await response.json();

    this.setState({ isLoaded: true, rendered: ajax.rendered });
  }

  render() {
    const {
      error, isLoaded, rendered,
    } = this.state;

    if (error) {
      return (
        <Alert variant="danger" className="mt-4">
          {error.toString()}
        </Alert>
      );
    }

    if (!isLoaded) {
      return (
        <div className="mt-4">Loading...</div>
      );
    }

    return (
      <div className="mt-4" id="editor-preview" dangerouslySetInnerHTML={{ __html: rendered }} />
    );
  }
}

MDXPreview.defaultProps = {
};

MDXPreview.propTypes = {
  content: PropTypes.string.isRequired,
};

export default hot(module)(MDXPreview);
