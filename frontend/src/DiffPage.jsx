import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import { connect } from 'react-redux';
import SelectSearch from 'react-select';
import PropTypes from 'prop-types';
import CommitSelect from './CommitSelect';
import DiffOverview from './DiffOverview';
import { store } from './store/index';
import { documentationSelected } from './actions';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DiffPage extends React.Component {
  state = {
    docus: [],
    error: null,
    cloneUrl: '',
  };

  constructor(props) {
    super(props);

    this.handleDocuChange = this.handleDocuChange.bind(this);
  }

  componentDidMount() {
    fetch('/api/documentations')
      .then((r) => r.json())
      .then(
        (docus) => {
          this.setState({
            docus: docus.map((b) => ({ label: b, value: b })),
          });
        },

        (error) => {
          this.setState({
            error,
          });
        },
      );
  }

  handleDocuChange(selectedValue) {
    store.dispatch(documentationSelected(selectedValue.value));
  }

  render() {
    const {
      docus, error, cloneUrl,
    } = this.state;

    const { docuId } = this.props;

    if (error) {
      return (
        <Container className="mt-5">
          <p>{error}</p>
        </Container>
      );
    }

    if (!docuId) {
      return (
        <Container className="mt-5">
          <Row className="select-diff">
            <Col lg={12} xs={12}>
              Select documentation:
              <SelectSearch
                onChange={this.handleDocuChange}
                options={docus}
                value={docus.find((o) => o.value === docuId)}
                search
              />
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
              value={docus.find((o) => o.value === docuId)}
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
            <CommitSelect id="from" from />
          </Col>
          <Col lg={6} xs={12}>
            <strong>Ending with revision:</strong>
            <CommitSelect id="to" from={false} />
          </Col>
        </Row>
        <Row className="results">
          <Col>
            <DiffOverview docu={docuId} />
          </Col>
        </Row>
      </Container>
    );
  }
}

DiffPage.propTypes = {
  docuId: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({ docuId: state.docuId });

export default hot(module)(connect(mapStateToProps)(DiffPage));
