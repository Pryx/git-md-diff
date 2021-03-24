import { hot } from 'react-hot-loader';
import React from 'react';
import { Link } from 'wouter';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import { Badge } from 'react-bootstrap';
import Diff from '../diff/diff';
import ky from 'ky';

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
    this.link = `/documentation/${props.docuId}/edit/${encodeURIComponent(props.newFile).replaceAll('.', '%2E')}`;
  }

  componentDidMount() {
    const {
      docuId, from, to, newFile, oldFile
    } = this.props;

    const fetchDiff = async () => {
      const original = await ky(`/api/documentations/${docuId}/${from}/pages/${encodeURIComponent(oldFile)}`).json();
      const modified = await ky(`/api/documentations/${docuId}/${to}/pages/${encodeURIComponent(newFile)}`).json();
      const content = await Diff({ docuId, from, to }, original.data, modified.data, this.options);

      this.setState(
        {
          isLoaded: true,
          content
        }
      );
    };

    fetchDiff().catch((error) => this.setState({
      isLoaded: true,
      error,
    }));
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded, content,
    } = this.state;

    const { renamed, newFile, oldFile } = this.props;
    const filename = newFile == oldFile ? newFile : `${oldFile} => ${newFile}`;

    let badges = [];
    if (renamed){
      badges.push(<Badge variant="warning">Renamed</Badge>)
    }

    if (error) {
      return (
        <Card>
          <Card.Header>
            {filename}
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
            {badges}
          </Card.Footer>
        </Card>
      );
    }

    if (!isLoaded) {
      return (
        <Card>
          <Card.Header>
            {filename}
          </Card.Header>
          <Card.Body>
            Loading...
          </Card.Body>
          <Card.Footer>
            {badges}
          </Card.Footer>
        </Card>
      );
    }

    let cls = '';
    if (content.newFile) {
      cls = 'newfile';
      badges.push(<Badge variant="success">NEW</Badge>)
    }

    let items = null;
    if (content.invisible.length){
      items = content.invisible.map((change) => ( 
        <Badge variant={change.variant} key={change.id}>{change.text}</Badge>
      )  
      );
      badges = badges.concat(items)
    }

    return (
      <Card className={cls}>
        <Card.Header>
          <Link href={this.link}>{filename}</Link>
        </Card.Header>
        <Card.Body dangerouslySetInnerHTML={{ __html: content.content }} />
        <Card.Footer>
          {badges}
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
  newFile: PropTypes.string.isRequired,
  oldFile: PropTypes.string.isRequired,
  hideCode: PropTypes.bool,
  renamed: PropTypes.bool.isRequired,
};

export default hot(module)(DiffView);
