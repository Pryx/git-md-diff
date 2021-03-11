import { hot } from 'react-hot-loader';
import React from 'react';
import { Link } from 'wouter';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import Markdown from 'markdown-to-jsx';
import { Badge } from 'react-bootstrap';
import Diff from './diff/diff';

/**
 * Diff view shows the diff file contents. Currently this
 * even handles the file diffing itself, this should
 * probably be offloaded to the server.
 */
class DiffView extends React.Component {
  link = null;

  state = {
    isLoaded: false,
    content: '',
  };

  constructor(props) {
    super(props);
    this.options = { hideCode: props.hideCode, returnMdx: true, debug: false };

    // This is needed because for some reason encodeUriComponent doesn't encode dots
    this.link = `/edit/${this.docuId}/${encodeURIComponent(props.file).replace('.', '%2E')}`;
  }

  componentDidMount() {
    const {
      docuId, from, to, file,
    } = this.props;
    fetch(`/api/documentations/${docuId}/${from}/pages/${encodeURIComponent(file)}`)
      .then((r) => r.json())
      .then(
        (original) => {
          fetch(`/api/documentations/${docuId}/${to}/pages/${encodeURIComponent(file)}`)
            .then((r) => r.json())
            .then(
              (modified) => {
                const contentPromise = new Promise((resolve, reject) => {
                  let content = Diff({ docuId, from, to }, original.content, modified.content, this.options)
                  resolve(content)
                });

                contentPromise.then((content) => this.setState(
                  {
                    isLoaded: true,
                    content
                  }
                )
                )
              },
              (error) => {
                this.setState({
                  isLoaded: true,
                  error,
                });
              },
            );
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        },
      );
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded, content,
    } = this.state;

    const { insertions, deletions, file } = this.props;

    if (error) {
      return (
        <Card>
          <Card.Header>
            <a className="title">{file}</a>
            <span className="changes float-right">
              Changes:
              <span className="additions">
                +
                {insertions}
              </span>
              {' '}
              <span className="deletions">
                -
                {deletions}
              </span>
            </span>
          </Card.Header>
          <Card.Body>
            Error:
            {' '}
            {error.message}
            <br />
            <br />
            Content:
            <pre>{content.content}</pre>
          </Card.Body>
          <Card.Footer>
            Invisible changes: N/A
          </Card.Footer>
        </Card>
      );
    }

    if (!isLoaded) {
      return (
        <Card>
          <Card.Header>
            <span className="title">{file}</span>
            <span className="changes float-right">
              Changes:
              <span className="additions">
                +
                {insertions}
              </span>
              {' '}
              <span className="deletions">
                -
                {deletions}
              </span>
            </span>
          </Card.Header>
          <Card.Body>
            Loading...
          </Card.Body>
          <Card.Footer>
            Invisible changes: Loading...
          </Card.Footer>
        </Card>
      );
    }

    let cls = '';
    if (content.newFile) {
      cls = 'newfile';
    }

    return (
      <Card className={cls}>
        <Card.Header>
          {content.newFile
            && <Badge variant="success">NEW</Badge>}
          &nbsp;
          <Link href={this.link}>
            <a className="title">{file}</a>
          </Link>

          <span className="changes float-right">
            Changes:
            <span className="additions">
              +
              {insertions}
            </span>
            {' '}
            <span className="deletions">
              -
              {deletions}
            </span>
          </span>
        </Card.Header>
        <Card.Body dangerouslySetInnerHTML={{ __html: content.content }} />
        <Card.Footer>
          Invisible changes:
          {' '}
          {content.invisible.join(', ')}
        </Card.Footer>
      </Card>
    );
  }
}

DiffView.defaultProps = {
  hideCode: true,
};

DiffView.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  docuId: PropTypes.string.isRequired,
  file: PropTypes.string.isRequired,
  insertions: PropTypes.number.isRequired,
  deletions: PropTypes.number.isRequired,
  hideCode: PropTypes.bool,
};

export default hot(module)(DiffView);
