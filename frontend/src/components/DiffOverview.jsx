import { hot } from 'react-hot-loader';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DiffView from './DiffView';
import { logOut, updateChangesList } from '../actions';
import { store } from '../store';
import { secureKy } from '../entities/secure-ky';
import ProofreadingRequest from '../entities/proofreading-request';

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

  componentDidUpdate(prevProps) {
    const { from, docuId, to } = this.props;
    // You don't have to do this check first, but it can help prevent an unneeded render
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

      fetchChanges().catch((error) => {
        if (error.response && error.response.status === 403) {
          store.dispatch(logOut());
        }

        this.setState({
          isLoaded: true,
          error,
        });
      });
    }
  }

  render() {
    const {
      error, isLoaded, ready, changes,
    } = this.state;

    const {
      from, docuId, to, version, proofreadingReq, noChangesMessage,
    } = this.props;

    if (error) {
      return (
        <div>
          Error:
          {' '}
          {error.message}
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

    if (!changes.length) {
      return (
        <Row className="mt-4">
          <Col>
            {noChangesMessage}
          </Col>
        </Row>
      );
    }

    return (
      changes.map(
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
              />
            </Col>
          </Row>
        ),
      )
    );
  }
}

DiffOverview.defaultProps = {
  proofreadingReq: null,
  noChangesMessage: 'No changes in Markdown files for the selected revision range',
};

DiffOverview.propTypes = {
  docuId: PropTypes.number.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
  proofreadingReq: PropTypes.shape(ProofreadingRequest.getShape()),
  noChangesMessage: PropTypes.string,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : '',
  to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : '',
  version: state.endRevision ? state.endRevision.branch : '',
});

export default hot(module)(connect(mapStateToProps)(DiffOverview));
