import { hot } from 'react-hot-loader';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import DiffView from './DiffView';
import { connect } from "react-redux";

/**
 * The diff overview component acts as a wrapper to 
 * diff view components. It's basically a list of files
 * and their changes.
 */
class DiffOverview extends React.Component {
  state = {
    changes: [],
    before: [],
    after: [],
  };

  constructor(props) {
    super(props);
    this.state = {
      changes: [],
      isLoaded: false,
      ready: false,
    };
  }
  
  componentDidMount(){
    this.componentWillReceiveProps(this.props)
  }

  componentWillReceiveProps(props) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    this.setState({
      ready: false,
      error: null
    });
    if (props.from && props.to) {
      this.setState({
        ready: true,
        isLoaded: false,
      });

      fetch(`/api/${this.props.docuId}/list-changes/${props.from}/${props.to}`)
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

    if (changes.length == 0) {
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
              <DiffView file={change.file} insertions={change.insertions} deletions={change.deletions} from={this.props.from} to={this.props.to} repo={this.props.docuId} />
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
};

const mapStateToProps = state => {
  return {
    docuId: state.docuId,
    from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : null,
    to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : null
  };
};

export default hot(module)(connect(mapStateToProps)(DiffOverview));
