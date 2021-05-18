import PropTypes from 'prop-types';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import SelectSearch from 'react-select';
import { documentationEmpty, revisionSelected } from '../../actions';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import { store } from '../../store';

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
    // Reload if docu updated
    if (docuId !== prev.docuId) {
      this.reloadData();
    }
  }

  /**
   * Handles the selection of a branch and reloads the commits
   * @param {Object} selectedOption The selected option object
   */
  handleBranch(selectedOption) {
    const { from, docuId, includeCommits } = this.props;
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
        commits: [],
      },
    );

    const fetchCommits = async () => {
      const commits = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${encodeURIComponent(selectedOption.value)}/revisions`).json();

      this.setState(
        {
          isLoaded: true,
          commits: commits.data.map((c) => {
            const date = new Date(c.created);
            const format = new Intl.DateTimeFormat('default', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(date);

            return {
              label: (
                <span>
                  <strong>
                    {format}
                    ,
                    {' '}
                    {c.author.name}
                  </strong>
                  :
                  {' '}
                  {c.title}
                </span>),
              value: c.shortId,
            };
          }),
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

    if (includeCommits) {
      fetchCommits();
    }
  }

  /**
   * Handles the selection of a commit
   * @param {Object} selectedOption The selected option object
   */
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

  /**
   * A helper function to get the current branch from the revision data
   * @returns {string} The current branch
   */
  getCurrentBranch() {
    const { from, startRevision, endRevision } = this.props;
    if (from) {
      return startRevision ? startRevision.branch : null;
    }

    return endRevision ? endRevision.branch : null;
  }

  /**
   * A helper function to get the current commit from the revision data
   * @returns {string} The current commit
   */
  getCurrentCommit() {
    const { from, startRevision, endRevision } = this.props;
    if (from) {
      return startRevision ? startRevision.commit : null;
    }

    return endRevision ? endRevision.commit : null;
  }

  /**
   * Gets the commit selected in the second CommitSelect
   * @returns {string} The current commit selected in the second CommitSelect
   */
  getCounterpartCommit() {
    const { from, startRevision, endRevision } = this.props;
    if (!from) {
      return startRevision ? startRevision.commit : null;
    }

    return endRevision ? endRevision.commit : null;
  }

  /**
   * Reloads the default data for a documentation
   */
  reloadData() {
    const { from, docuId } = this.props;
    this.setState({ error: null });

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
          commits: commits.data.map((c) => {
            const date = new Date(c.created);
            const format = new Intl.DateTimeFormat('default', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(date);
            return {
              label: (
                <span>
                  <strong>
                    {format}
                    ,
                    {' '}
                    {c.author.name}
                  </strong>
                  :
                  {' '}
                  {c.title}
                </span>),
              value: c.shortId,
            };
          }),
        },
      );
    };

    fetchData().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  render() {
    const {
      error, isLoaded, branches, commits,
    } = this.state;

    const { includeCommits, from } = this.props;

    const counterpartCommit = this.getCounterpartCommit();
    const counterpartIdx = commits.findIndex((c) => c.value === counterpartCommit);
    const slicedCommits = from ? commits : commits.slice(0, counterpartIdx);

    if (error) {
      return (
        <div>
          {error}
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
          <Col md={4}>
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
              options={slicedCommits}
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
