import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import CommitSelect from './CommitSelect';
import DiffOverview from './DiffOverview';
import { connect } from "react-redux";
import SelectSearch from 'react-select';
import { store } from './store/index';
import { documentationSelected } from './actions';


/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DiffPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      docus: [],
      error: null,
      cloneUrl: '',
    };

    this.handleClone = this.handleClone.bind(this);
    this.handleCloneUrl = this.handleCloneUrl.bind(this);
    this.handleDocuChange = this.handleDocuChange.bind(this);
  }

  handleClone(e) {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: this.state.cloneUrl }),
    };
    fetch('/api/clone', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const { docus } = this.state;
          docus.push(data.name);
          this.setState({ docus, cloneUrl: '' });
        } else {
          this.setState({ error: "Couldn't clone repository!" });
        }
      });
  }

  componentDidMount() {
    fetch('/api/documentations')
      .then((r) => r.json())
      .then(
        (docus) => {
          this.setState({
            docus: docus.map((b) => {return {label: b, value: b}}),
          });
        },

        (error) => {
          this.setState({
            error,
          });
        },
      );
  }

  handleCloneUrl(e) {
    this.setState(
      {
        cloneUrl: e.currentTarget.value,
      },
    );
  }

  handleDocuChange(selectedValue) {
    store.dispatch(documentationSelected(selectedValue.value))
  }

  render() {
    const {
      docus, error, cloneUrl,
    } = this.state;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    } 
    
    if (!this.props.docuId) {
      return (
        <Container className="mt-5">
          <Row className="select-diff">
            <Col lg={6} xs={12}>
              Select documentation:
              <SelectSearch
                onChange={this.handleDocuChange}
                options={docus}
                value={docus.find(o => o.value === this.props.docuId)}
                search
                />
            </Col>
            <Col lg={6} xs={12}>
              Or clone a new one:
              <InputGroup className="mb-3">
                <FormControl onChange={this.handleCloneUrl} value={cloneUrl} disabled/>
                <InputGroup.Append>
                  <Button onClick={this.handleClone} disabled>
                    Clone!
                  </Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
        </Container>
      );
    }
    return (
      <Container className="mt-5">
        <Row className="mt-3 mb-2">
          <Col lg={12}><h1>Page revision comparison</h1></Col>
        </Row>
        <Row className="select-diff">
          <Col lg={6} xs={12}>
            Select documentation:
            <SelectSearch
                onChange={this.handleDocuChange}
                options={docus}
                value={docus.find(o => o.value === this.props.docuId)}
                search
                />
          </Col>
          <Col lg={6} xs={12}>
            Or clone a new one:
            <InputGroup className="mb-3">
              <FormControl onChange={this.handleCloneUrl} value={cloneUrl} disabled />
              <InputGroup.Append>
                <Button onClick={this.handleClone} disabled>
                    Clone!
                  </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
        </Row>
        <Row className="select-diff">
          <Col lg={6} xs={12}>
            <strong>Starting with revision:</strong>
            <CommitSelect id="from" from={true} />
          </Col>
          <Col lg={6} xs={12}>
            <strong>Ending with revision:</strong>
            <CommitSelect id="to" from={false} />
          </Col>
        </Row>
        <Row className="results">
          <Col>
            <DiffOverview repo={this.props.docuId} />
          </Col>
        </Row>
      </Container>
    );
  }
}

const mapStateToProps = state => {
  return { docuId: state.docuId };
};

export default hot(module)(connect(mapStateToProps)(DiffPage));
