import { hot } from 'react-hot-loader';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import SelectSearch from 'react-select';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { store } from '../store';
import { documentationEmpty, revisionSelected } from '../actions';
import { Alert } from 'react-bootstrap';

/**
 * This is the commit selector component. This allows us to
 * pick two commits even between branches.
 */
class CommitSelect extends React.Component {
  state = {
    error: null,
    isLoaded: false,
    branches: [],
    commits: [],
  };

  constructor(props) {
    super(props);
    this.handleBranch = this.handleBranch.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
  }

  componentDidMount() {
    this.reloadData();
  }

  componentDidUpdate(prev) {
    const { docuId } = this.props;
    if (docuId !== prev.docuId) {
      this.reloadData();
    }
  }

  static getDerivedStateFromProps() {
    return { error: null };
  }

  handleBranch(selectedOption) {
    const { from, docuId } = this.props;
    store.dispatch(
      revisionSelected({
        from,
        revisionData: {
          branch: selectedOption.value,
          commit: null,
        },
      }),
    );

    this.setState(
      {
        isLoaded: false,
      },
    );

    fetch(`/api/documentations/${docuId}/${encodeURIComponent(selectedOption.value)}/revisions`)
      .then((r) => r.json())
      .then((commits) => {
        this.setState(
          {
            isLoaded: true,
            commits: commits.all.map((c) => ({ label: c.message, value: c.hash })),
          },
        );
      });
  }

  handleCommit(selectedOption) {
    const { from } = this.props;

    store.dispatch(
      revisionSelected({
        from,
        revisionData: {
          branch: this.getCurrentBranch(),
          commit: selectedOption.value,
        },
      }),
    );
  }

  getCurrentBranch() {
    const { from, startRevision, endRevision } = this.props;
    if (from) {
      return startRevision ? startRevision.branch : null;
    }

    return endRevision ? endRevision.branch : null;
  }

  getCurrentCommit() {
    const { from, startRevision, endRevision } = this.props;
    if (from) {
      return startRevision ? startRevision.commit : null;
    }

    return endRevision ? endRevision.commit : null;
  }

  reloadData() {
    const { from, docuId } = this.props;
    fetch(`/api/documentations/${docuId}/versions`)
      .then((r) => r.json())
      .then(
        (branches) => {
          if (!branches.data.length){
            store.dispatch(documentationEmpty());
            return;
          }

          // Let's be inclusive after the master branch debacle :)
          let cb = this.getCurrentBranch() || branches.data.includes('master') ? 'master' : null;
          if (!cb){
            cb = branches.data.includes('main') ? 'main' : branches.data[0];
          }
          this.setState({
            branches: branches.data.map((b) => ({ label: b, value: b })),
            commits: [],
          });

          fetch(`/api/documentations/${docuId}/${cb}/revisions`)
            .then((r) => r.json())
            .then((commits) => {
              store.dispatch(
                revisionSelected({
                  from,
                  revisionData: {
                    branch: cb,
                    commit: this.getCurrentCommit()
                      || (from && commits.data.length>1 ? commits.data[1].id : commits.data[0].id),
                  },
                }),
              );

              this.setState(
                {
                  isLoaded: true,
                  commits: commits.data.map((c) => ({ label: `[${c.shortId}] ${c.title} (Author: ${c.author.name})`, value: c.id })),
                },
              );
            });
        },

        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        },
      );
  }

  render() {
    const {
      error, isLoaded, branches, commits
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

    if (!isLoaded) {
      return (
        <div>
          Loading...
        </div>
      );
    }

    const customStyles = {
      option: (provided) => ({
        ...provided,
        wordWrap: 'break-word',
      }),
    };

    return (
      <Form.Row>
        <Col>
          <SelectSearch
            onChange={this.handleBranch}
            options={branches}
            value={branches.find((o) => o.value === this.getCurrentBranch())}
            search
          />
        </Col>
        <Col>
          <SelectSearch
            onChange={this.handleCommit}
            options={commits}
            value={commits.find((o) => o.value === this.getCurrentCommit())}
            styles={customStyles}
            search
          />
        </Col>
      </Form.Row>
    );
  }
}

CommitSelect.defaultProps = {
};

CommitSelect.propTypes = {
  docuId: PropTypes.string.isRequired,
  startRevision: PropTypes.object,
  endRevision: PropTypes.object,
  from: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuId: state.docuId,
    startRevision: state.startRevision,
    endRevision: state.endRevision,
  }
);

export default hot(module)(connect(mapStateToProps)(CommitSelect));
