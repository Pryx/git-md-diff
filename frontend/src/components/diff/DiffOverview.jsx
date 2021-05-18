import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { excludeChange, includeChange, updateChangesList } from '../../actions';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import ProofreadingRequest from '../../shapes/proofreading-request';
import { store } from '../../store';
import DiffView from './DiffView';

/**
 * The diff overview component acts as a wrapper to
 * diff view components. It's basically a list of files
 * and their changes.
 */
class DiffOverview extends React.Component {
  state = {
    isLoaded: false,
    ready: false,
  };

  componentDidMount() {
    this.componentDidUpdate();
  }

  static getDerivedStateFromProps(props, state) {
    const { from, to } = props;
    return { ...state, error: null, ready: from && to };
  }

  /**
   * If from and to changed, updates the data
   * @param {*} prevProps Previous react props
   */
  componentDidUpdate(prevProps) {
    const { from, docuId, to } = this.props;
    let lastFrom = null;
    let lastTo = null;

    if (prevProps) {
      lastFrom = prevProps.from;
      lastTo = prevProps.to;
    }

    if (from && to && (lastFrom !== from || lastTo !== to)) {
      const fetchChanges = async () => {
        const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/changes/${from}/${to}`).json();

        store.dispatch(updateChangesList(json.data));

        this.setState({
          isLoaded: true,
          changes: json.data,
        });
      };

      fetchChanges().catch(async (error) => {
        const errorMessage = await getPossiblyHTTPErrorMessage(error);
        if (errorMessage === null) return; // Expired tokens

        this.setState({
          error: errorMessage,
          isLoaded: true,
        });
      });
    }
  }

  render() {
    const {
      error, isLoaded, ready, changes,
    } = this.state;

    const {
      from, docuId, to, version, proofreadingReq, noChangesMessage, excludedChanges,
    } = this.props;

    if (error) {
      return (
        <div>
          {error}
        </div>
      );
    }

    if (!ready) {
      return (
        <div>
          Please select revisions
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div>
          Loading...
        </div>
      );
    }

    if (!changes) {
      return (
        <Row className="mt-4">
          <Col>
            <Alert variant="warning">Couldn&apos;t get changes. Maybe branch was deleted?</Alert>
          </Col>
        </Row>
      );
    }

    if (!changes.length) {
      return (
        <Row className="mt-4">
          <Col>
            <Alert variant="secondary">{noChangesMessage}</Alert>
          </Col>
        </Row>
      );
    }

    let btns = null;

    const selectAll = () => changes.forEach((change) => {
      store.dispatch(includeChange(change.newFile));
    });

    const deselectAll = () => changes.forEach((change) => {
      store.dispatch(excludeChange(change.newFile));
    });

    if (!proofreadingReq) {
      btns = (
        <div>
          <Button variant="secondary" size="sm" className="mr-2" onClick={selectAll}>Select all</Button>
          <Button variant="secondary" size="sm" onClick={deselectAll}>Unselect all</Button>
        </div>
      );
    }

    return (
      <div>
        {btns}
        {changes.map(
          (change) => (
            <Row key={change.newFile} className="mt-4">
              <Col>
                <DiffView
                  newFile={change.newFile}
                  oldFile={change.oldFile}
                  renamed={change.renamed}
                  from={from}
                  to={to}
                  version={version}
                  docuId={docuId}
                  proofreadingReq={proofreadingReq}
                  selected={!excludedChanges.includes(change.newFile)}
                />
              </Col>
            </Row>
          ),
        )}
      </div>
    );
  }
}

DiffOverview.defaultProps = {
  proofreadingReq: null,
  noChangesMessage: 'No changes in Markdown files for the selected revision range',
  excludedChanges: [],
};

DiffOverview.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  proofreadingReq: PropTypes.shape(ProofreadingRequest),
  noChangesMessage: PropTypes.string,
  excludedChanges: PropTypes.arrayOf(PropTypes.string),
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : '',
  to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : '',
  version: state.endRevision ? state.endRevision.branch : '',
  excludedChanges: state.excludedChanges,
});

export default hot(module)(connect(mapStateToProps)(DiffOverview));
