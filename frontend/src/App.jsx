import { hot } from 'react-hot-loader';
import React from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import CommitSelect from './CommitSelect';
import DiffOutput from './DiffOutput';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      commitFrom: { branch: '', commit: '' },
      commitTo: { branch: '', commit: '' },
    };
  }

  updateFrom = (from) => {
    this.setState({
      commitFrom: from,
    });
  };

  updateTo = (to) => {
    this.setState({
      commitTo: to,
    });
  };

  render() {
    const { commitTo, commitFrom } = this.state;

    const to = commitTo.commit || commitTo.branch;
    const from = commitFrom.commit || commitFrom.branch;

    console.log('TO', to, 'FROM', from);

    return (
      <Container className="mt-5">
        <Row className="select-diff">
          <Col lg={6} xs={12}>
            Select from
            <CommitSelect id="from" dependsOn="to" comparison="<" update={this.updateFrom} />
          </Col>
          <Col lg={6} xs={12}>
            Select to
            <CommitSelect id="to" dependsOn="from" comparison=">" update={this.updateTo} />
          </Col>
        </Row>
        <Row className="results">
          <Col>
            <DiffOutput from={from} to={to} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default hot(module)(App);
