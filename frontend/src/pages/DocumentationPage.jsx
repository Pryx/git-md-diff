import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, Tab, Tabs,
} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { Link, Redirect } from 'wouter';
import { documentationSelected, logOut } from '../actions';
import DiffWrapper from '../components/DiffWrapper';
import EditWrapper from '../components/EditWrapper';
import accessLevels from '../constants/access-levels';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationPage extends React.Component {
  state = {
    error: '',
    isLoaded: false,
  };

  constructor(props) {
    super(props);

    const { docuId } = this.props;
    store.dispatch(documentationSelected(docuId));

    this.newRequest.bind(this);
  }

  componentDidMount() {
    const { docuId } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}`).json();
      this.setState({
        docu: json.data,
        isLoaded: true,
      });
    };

    fetchPage().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error: error.toString(),
      });
    });
  }

  newRequest(e) {
    e.preventDefault();
    const { docuId } = this.props;
    const fetchPage = async () => {
      const json = await secureKy().put(`${window.env.api.backend}/proofreading/${docuId}`).json();
      this.setState({
        docu: json.data,
        isLoaded: true,
      });
    };

    fetchPage().catch((error) => {
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
    const { docuId } = this.props;
    const { error, docu, isLoaded } = this.state;

    if (!isLoaded) {
      return 'Loading...';
    }

    if (error) {
      return <Alert variant="info">{error}</Alert>;
    }

    let settings = null;
    if (docu.accessLevel <= accessLevels.manager) {
      if (docu.accessLevel === accessLevels.admin) {
        settings = <Link href={`/documentation/${docuId}/settings`}><Button variant="primary" className="float-right"><i className="fas fa-cog" /></Button></Link>;
      }

      return (
        <Container className="mt-5">
          <Row>
            <Col lg={12} xs={12}>
              <h1>
                {docu.name}
                {' '}
                {settings}
              </h1>
              <p className="text-muted">{docu.description}</p>
            </Col>
          </Row>
          <Tabs defaultActiveKey="files" id="docutabs">
            <Tab eventKey="files" title="Files">
              <EditWrapper />
            </Tab>
            <Tab eventKey="diff" title="Differences / Create proofreading request">
              <DiffWrapper buttonTitle="Create proofreading request" onClick={this.newRequest} />
            </Tab>
          </Tabs>
        </Container>
      );
    }

    if (docu.accessLevel === accessLevels.author) {
      return (
        <Container className="mt-5">
          <Row>
            <Col lg={12} xs={12}>
              <h1>{docu.name}</h1>
              <p className="text-muted">{docu.description}</p>
            </Col>
          </Row>
          <Tabs defaultActiveKey="files" id="docutabs">
            <Tab eventKey="files" title="Files">
              <EditWrapper />
            </Tab>
          </Tabs>
        </Container>
      );
    }

    return (<Redirect to="/" />);
  }
}

DocumentationPage.propTypes = {
  docuId: PropTypes.number.isRequired,
};

export default hot(module)(DocumentationPage);
