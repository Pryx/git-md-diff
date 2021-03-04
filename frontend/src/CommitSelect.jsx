import { hot } from 'react-hot-loader';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import SelectSearch from 'react-select';
import { connect } from "react-redux";
import { store } from './store';
import { revisionSelected } from './actions';

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

    this.state = {
      isLoaded: false,
      branches: [],
      commits: [],
    };
  }

  getCurrentBranch(){
    if (this.props.from){
      return this.props.startRevision ? this.props.startRevision.branch : null;
    }

    return this.props.endRevision ? this.props.endRevision.branch : null;
  }

  getCurrentCommit(){
    if (this.props.from){
      return this.props.startRevision ? this.props.startRevision.commit : null;
    }
    
    return this.props.endRevision ? this.props.endRevision.commit : null;
  }

  reloadData(){
    fetch(`/api/documentations/${this.props.docuId}/versions`)
        .then((r) => r.json())
        .then(
          (branches) => {
            // Let's be inclusive after the master branch debacle :)
            const cb = this.getCurrentBranch() || branches.all.includes('master') ? 'master' : (branches.all.includes('main') ? 'main' : branches.all[0]);
            this.setState({
              branches: branches.all.map((b) => { return { label: b, value: b } }),
              commits: [],
              currentCommit: '',
            });

            fetch(`/api/documentations/${this.props.docuId}/${cb}/revisions`)
              .then((r) => r.json())
              .then((commits) => {
                store.dispatch(
                  revisionSelected({
                    from: this.props.from,
                    revisionData: {
                      branch: cb,
                      commit: this.getCurrentCommit() || (this.props.from ? commits.all[1].hash : commits.all[0].hash),
                    }
                  })
                );

                this.setState(
                  {
                    isLoaded: true,
                    commits: commits.all.map((c) => { return { label: c.message, value: c.hash } }),
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

  componentDidMount() {
    this.reloadData();  
  }

  componentDidUpdate(prev) {
    if (this.props.docuId != prev.docuId){
      this.reloadData();  
    }
  }

  static getDerivedStateFromProps(props, state) {
    return {error: null}
  }

  handleBranch(selectedOption) {
    store.dispatch(
      revisionSelected({
        from: this.props.from,
        revisionData: {
          branch: selectedOption.value,
          commit: null,
        }
      })
    );

    this.setState(
      {
        isLoaded: false,
        currentBranch: selectedOption.value,
      },
    );

    fetch(`/api/documentations/${this.props.docuId}/${encodeURIComponent(selectedOption.value)}/revisions`)
      .then((r) => r.json())
      .then((commits) => {
        this.setState(
          {
            isLoaded: true,
            commits: commits.all.map((c) => { return { label: c.message, value: c.hash } }),
          },
        );
      });
  }

  handleCommit(selectedOption) {
    const { currentBranch } = this.state;

    store.dispatch(
      revisionSelected({
        from: this.props.from,
        revisionData: {
          branch: currentBranch,
          commit: selectedOption.value,
        }
      })
    );

    this.setState(() => (
      {
        currentCommit: selectedOption.value,
      }));
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
      option: (provided, state) => ({
        ...provided,
        wordWrap: 'break-word'
      })
    }
    
    return (
      <Form.Row>
        <Col>
          <SelectSearch
            onChange={this.handleBranch}
            options={branches}
            value={branches.find(o => o.value === this.getCurrentBranch())}
            search
          />
        </Col>
        <Col>
          <SelectSearch
            onChange={this.handleCommit}
            options={commits}
            value={commits.find(o => o.value === this.getCurrentCommit())}
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
};

const mapStateToProps = state => {
  return { docuId: state.docuId, startRevision: state.startRevision, endRevision: state.endRevision};
};

export default hot(module)(connect(mapStateToProps)(CommitSelect));
