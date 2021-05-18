import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Badge, Button, Form, OverlayTrigger, Tooltip,
} from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { hot } from 'react-hot-loader';
import { Link } from 'wouter';
import { excludeChange, includeChange } from '../../actions';
import ProofreadingRequest from '../../shapes/proofreading-request';
import Diff from '../../helpers/diff';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import { store } from '../../store';

/**
 * Diff view shows the diff file contents
 */
class DiffView extends React.Component {
  link = null;

  state = {
    isLoaded: false,
    content: '',
    isOpen: false,
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
    this.toggle = this.toggle.bind(this);
  }

  /**
   * Fetches new data on mount
   */
  componentDidMount() {
    const {
      newFile, proofreadingReq,
    } = this.props;

    if (proofreadingReq && proofreadingReq.excluded.indexOf(newFile) !== -1) {
      return;
    }

    this.fetchNewDiff();
  }

  /**
   * Decides whether to update the components data
   * @param {*} prevProps previous react props
   */
  componentDidUpdate(prevProps) {
    const { from, to } = this.props;
    if (prevProps.from !== from || prevProps.to !== to) {
      this.fetchNewDiff();
    }
  }

  /**
   * Error boundary
   * @param {*} error The error that occured in one of the components
   * @returns derived state
   */
  static getDerivedStateFromError(error) {
    return { error };
  }

  /**
   * Callback on file select/deselect
   * @param {Event} e The JS event
   */
  checkboxCallback(e) {
    const {
      newFile,
    } = this.props;

    if (e.target.checked) {
      store.dispatch(includeChange(newFile));
    } else {
      store.dispatch(excludeChange(newFile));
    }
  }

  /**
   * Fetches new file diff
   */
  fetchNewDiff() {
    const {
      docuId, from, to, newFile, oldFile,
    } = this.props;

    const fetchDiff = async () => {
      const original = secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${from}/pages/${oldFile}`).json();
      const modified = secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${to}/pages/${newFile}`).json();
      const content = await Diff(
        { docuId, from, to },
        (await original).data,
        (await modified).data,
        this.options,
      );

      this.setState(
        {
          isLoaded: true,
          content,
          error: null,
        },
      );
    };

    fetchDiff().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  toggle() {
    const { isOpen } = this.state;
    this.setState({ isOpen: !isOpen });
  }

  render() {
    const {
      error, isLoaded, content, isOpen,
    } = this.state;

    const {
      renamed, newFile, oldFile, proofreadingReq, selected,
    } = this.props;

    // Account for renames
    const filename = newFile === oldFile ? newFile : `${oldFile} => ${newFile}`;

    if (proofreadingReq && proofreadingReq.excluded.indexOf(filename) !== -1) {
      return null;
    }

    let badges = [];
    if (renamed) {
      badges.push(
        <OverlayTrigger overlay={<Tooltip>This file has been renamed.</Tooltip>}>
          <Badge variant="warning">Renamed</Badge>
        </OverlayTrigger>,
      );
    }

    if (error) {
      return (
        <Card>
          <Card.Header>
            <div>
              <Link to={this.link}>{filename}</Link>
              <Link to={this.link}>
                <Button variation="primary" size="sm" className="float-right">
                  Edit
                </Button>
              </Link>
            </div>
            {badges}
          </Card.Header>
          <Card.Body>
            <Alert variant="danger">Error rendering changes:</Alert>
            {' '}
            <pre>{error}</pre>
          </Card.Body>
        </Card>
      );
    }

    if (!isLoaded) {
      return (
        <Card>
          <Card.Header>
            <Link to={this.link}>{filename}</Link>
            <Link to={this.link}>
              <Button variation="primary" size="sm" className="float-right">
                Edit
              </Button>
            </Link>
          </Card.Header>
          <Card.Body>
            Loading...
          </Card.Body>
        </Card>
      );
    }

    let cls = 'file-card';
    if (content.newFile) {
      cls += ' newfile';
      badges.push(
        <OverlayTrigger overlay={(
          <Tooltip>
            This file was not present in the starting commit.
          </Tooltip>
      )}
        >
          <Badge variant="success" key="newfile">Added new file</Badge>
        </OverlayTrigger>,
      );
    }

    if (isOpen) {
      cls += ' expanded';
    }

    let items = null;
    if (content.badges.length) {
      items = content.badges.map((change) => (
        <OverlayTrigger overlay={<Tooltip>{change.description}</Tooltip>}>
          <Badge variant={change.variant} key={change.id}>{change.title}</Badge>
        </OverlayTrigger>
      ));
      badges = badges.concat(items);
    }

    if (proofreadingReq && proofreadingReq.modified.indexOf(filename) !== -1) {
      badges.unshift(
        <OverlayTrigger overlay={(
          <Tooltip>
            This file has been already modified by the proofreader.
          </Tooltip>
)}
        >
          <Badge variant="primary" key="modified">
            <i className="fas fa-check" />
            {' '}
            Already reviewed &amp; modified
          </Badge>
        </OverlayTrigger>,
      );
    }

    return (
      <Card className={cls} key={filename}>
        <Card.Header>
          <div>
            {!proofreadingReq && <Form.Check type="checkbox" inline checked={selected} onChange={this.checkboxCallback} />}
            {' '}
            <Link to={this.link}>{filename}</Link>
            <Link to={this.link}>
              <Button variation="primary" size="sm" className="float-right">
                Edit
              </Button>
            </Link>
          </div>
          {badges}
        </Card.Header>
        <Card.Body dangerouslySetInnerHTML={{ __html: content.content }} />
        <Card.Footer>
          <div onClick={() => this.toggle()} role="button" tabIndex="0" onKeyDown={() => this.toggle()}>
            <i className="fas fa-chevron-down" />
          </div>
        </Card.Footer>
      </Card>
    );
  }
}

DiffView.defaultProps = {
  hideCode: true,
  version: '',
  proofreadingReq: null,
  selected: true,
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
  proofreadingReq: PropTypes.shape(ProofreadingRequest),
  selected: PropTypes.bool,
};

export default hot(module)(DiffView);
