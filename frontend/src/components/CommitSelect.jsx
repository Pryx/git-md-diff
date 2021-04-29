import { hot } from 'react-hot-loader';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import SelectSearch from 'react-select';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { store } from '../store';
import { documentationEmpty, logOut, revisionSelected } from '../actions';
import { secureKy } from '../entities/secure-ky';

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
    this.reloadData = this.reloadData.bind(this);
  }

  componentDidMount() {
    this.reloadData();
  }

  componentDidUpdate(prev) {
    const { docuId } = this.props;
    if (docuId !== prev.docuId) {
      this.setState({ error: null }); // eslint-disable-line
      this.reloadData();
    }
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

    const fetchCommits = async () => {
      const commits = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${encodeURIComponent(selectedOption.value)}/revisions`).json();

      this.setState(
        {
          isLoaded: true,
          commits: commits.data.map((c) => ({ label: `[${c.shortId}] ${c.title} (Author: ${c.author.name})`, value: c.shortId })),
        },
      );

      store.dispatch(
        revisionSelected({
          from,
          revisionData: {
            branch: selectedOption.value,
            commit: this.getCurrentCommit()
              || (from && commits.data.length > 1
                ? commits.data[1].shortId
                : commits.data[0].shortId),
          },
        }),
      );
    };

    fetchCommits();
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

    const fetchData = async () => {
      const branches = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/versions`).json();

      if (!branches.data.length) {
        store.dispatch(documentationEmpty());
        return;
      }

      // Do not blindly assume the default branch of the repository
      const cb = branches.data.find((o) => o.default === true).name || branches[0].name;

      this.setState({
        branches: branches.data.map((b) => ({ label: b.name, value: b.name })),
        commits: [],
      });

      const commits = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${cb}/revisions`).json();

      store.dispatch(
        revisionSelected({
          from,
          revisionData: {
            branch: cb,
            commit: this.getCurrentCommit()
              || (from && commits.data.length > 1
                ? commits.data[1].shortId
                : commits.data[0].shortId
              ),
          },
        }),
      );

      this.setState(
        {
          isLoaded: true,
          commits: commits.data.map((c) => ({ label: `[${c.shortId}] ${c.title} (Author: ${c.author.name})`, value: c.shortId })),
        },
      );
    };

    fetchData().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error: error.toString(),
      });
    });
  }

  render() {
    const {
      error, isLoaded, branches, commits,
    } = this.state;

    const { includeCommits } = this.props;

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

    if (includeCommits) {
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
      </Form.Row>
    );
  }
}

CommitSelect.defaultProps = {
  startRevision: {},
  endRevision: {},
  includeCommits: true,
};

CommitSelect.propTypes = {
  docuId: PropTypes.number.isRequired,
  startRevision: PropTypes.objectOf(PropTypes.string),
  endRevision: PropTypes.objectOf(PropTypes.string),
  from: PropTypes.bool.isRequired,
  includeCommits: PropTypes.bool,
};

const mapStateToProps = (state) => (
  {
    docuId: state.docuId,
    startRevision: state.startRevision,
    endRevision: state.endRevision,
  }
);

export default hot(module)(connect(mapStateToProps)(CommitSelect));
