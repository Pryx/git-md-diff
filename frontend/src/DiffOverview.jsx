import { hot } from 'react-hot-loader';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DiffView from './DiffView';

/**
 * The diff overview component acts as a wrapper to
 * diff view components. It's basically a list of files
 * and their changes.
 */
class DiffOverview extends React.Component {
  state = {
    changes: [],
    isLoaded: false,
    ready: false,
  };

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(props) {
    const { from, docuId, to } = props;
    // You don't have to do this check first, but it can help prevent an unneeded render
    this.setState({
      ready: false,
      error: null,
    });
    if (props.from && props.to) {
      this.setState({
        ready: true,
        isLoaded: false,
      });

      fetch(`/api/documentations/${docuId}/changes/${from}/${to}`)
        .then((r) => r.json())
        .then(
          (changes) => {
            this.setState({
              isLoaded: true,
              changes,
            });
          },
          // Note: it's important to handle errors here
          // instead of a catch() block so that we don't swallow
          // exceptions from actual bugs in components.
          (error) => {
            this.setState({
              isLoaded: true,
              error,
            });
          },
        );
    }
  }

  render() {
    const {
      error, isLoaded, changes, ready,
    } = this.state;

    const { from, docuId, to } = this.props;

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

    if (changes.length === 0) {
      return (
        <Row className="mt-4">
          <Col>
            No changes in Markdown files for the selected revision range
          </Col>
        </Row>
      );
    }

    return (
      changes.map(
        (change) => (
          <Row key={change.file} className="mt-4">
            <Col>
              <DiffView
                file={change.file}
                insertions={change.insertions}
                deletions={change.deletions}
                from={from}
                to={to}
                docuId={docuId}
              />
            </Col>
          </Row>
        ),
      )
    );
  }
}

DiffOverview.defaultProps = {
};

DiffOverview.propTypes = {
  docuId: PropTypes.string.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : '',
  to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : '',
});

export default hot(module)(connect(mapStateToProps)(DiffOverview));
