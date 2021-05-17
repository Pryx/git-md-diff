import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Badge, Form } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { hot } from 'react-hot-loader';
import { Link } from 'wouter';
import { excludeChange, includeChange } from '../actions';
import Diff from '../diff/diff';
import ProofreadingRequest from '../entities/proofreading-request';
import { logoutUser, secureKy } from '../entities/secure-ky';
import { store } from '../store';

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
    checked: true,
  };

  constructor(props) {
    super(props);
    this.options = { hideCode: props.hideCode, returnMdx: true, debug: false };

    if (props.proofreadingReq) {
      this.link = `/documentation/${props.docuId}/proofreading/${props.proofreadingReq.id}/v/${props.version}/r/${props.from}/${props.to}/f/${props.newFile}`;
    } else {
      this.link = `/documentation/${props.docuId}/edit/v/${props.version}/r/${props.from}/${props.to}/f/${props.newFile}`;
    }

    this.checkboxCallback = this.checkboxCallback.bind(this);
  }

  componentDidMount() {
    const {
      newFile, proofreadingReq,
    } = this.props;

    if (proofreadingReq && proofreadingReq.excluded.indexOf(newFile) !== -1) {
      return;
    }

    this.fetchNewDiff();
  }

  componentDidUpdate(prevProps) {
    const { from, to } = this.props;
    if (prevProps.from !== from || prevProps.to !== to) {
      this.fetchNewDiff();
    }
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  checkboxCallback(e) {
    this.setState({ checked: e.target.checked });
    const {
      newFile,
    } = this.props;

    if (e.target.checked) {
      store.dispatch(includeChange(newFile));
    } else {
      store.dispatch(excludeChange(newFile));
    }
  }

  fetchNewDiff() {
    const {
      docuId, from, to, newFile, oldFile,
    } = this.props;

    const fetchDiff = async () => {
      const original = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${from}/pages/${oldFile}`).json();
      const modified = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${to}/pages/${newFile}`).json();
      const content = await Diff({ docuId, from, to }, original.data, modified.data, this.options);

      this.setState(
        {
          isLoaded: true,
          content,
          error: null,
        },
      );
    };

    fetchDiff().catch(async (error) => {
      if (error.response && error.response.status === 403) {
        logoutUser();
        return;
      }

      const errorMessage = (await error.response.json()).error;
      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  render() {
    const {
      error, isLoaded, content, checked,
    } = this.state;

    const {
      renamed, newFile, oldFile, proofreadingReq,
    } = this.props;
    const filename = newFile === oldFile ? newFile : `${oldFile} => ${newFile}`;

    if (proofreadingReq && proofreadingReq.excluded.indexOf(filename) !== -1) {
      return null;
    }

    let badges = [];
    if (renamed) {
      badges.push(<Badge variant="warning">Renamed</Badge>);
    }

    if (error) {
      return (
        <Card>
          <Card.Header>
            <Link href={this.link}>{filename}</Link>
          </Card.Header>
          <Card.Body>
            <Alert variant="danger">Error rendering changes:</Alert>
            {' '}
            <pre>{error.message || error}</pre>
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
            <Link href={this.link}>{filename}</Link>
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

    let cls = 'file-card';
    if (content.newFile) {
      cls += ' newfile';
      badges.push(<Badge variant="success" key="newfile">Added new file</Badge>);
    }

    let items = null;
    if (content.invisible.length) {
      items = content.invisible.map((change) => (
        <Badge variant={change.variant} key={change.id}>{change.text}</Badge>
      ));
      badges = badges.concat(items);
    }

    if (proofreadingReq && proofreadingReq.modified.indexOf(filename) !== -1) {
      badges.unshift(
        <Badge variant="primary" key="modified">
          <i className="fas fa-check" />
          {' '}
          Already reviewed &amp; modified
        </Badge>,
      );
    }

    return (
      <Card className={cls} key={filename}>
        <Card.Header>
          {!proofreadingReq && <Form.Check type="checkbox" inline checked={checked} onChange={this.checkboxCallback} />}
          {' '}
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
  version: '',
  proofreadingReq: null,
};

DiffView.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  docuId: PropTypes.number.isRequired,
  newFile: PropTypes.string.isRequired,
  oldFile: PropTypes.string.isRequired,
  version: PropTypes.string,
  hideCode: PropTypes.bool,
  renamed: PropTypes.bool.isRequired,
  proofreadingReq: PropTypes.shape(ProofreadingRequest.getShape()),
};

export default hot(module)(DiffView);
