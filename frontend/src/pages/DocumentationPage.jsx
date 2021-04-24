import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link, Redirect } from 'wouter';
import { documentationSelected } from '../actions';
import DiffWrapper from '../components/DiffWrapper';
import EditWrapper from '../components/EditWrapper';
import accessLevels from '../constants/access-levels';
import Documentation from '../entities/documentation';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store/index';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationPage extends React.Component {
  state = {
    error: '',
    isLoaded: false
  };

  constructor(props) {
    super(props);

    const { docuId } = this.props;
    store.dispatch(documentationSelected(docuId));
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

  render() {
    const { docuId } = this.props;
    const { error, docu, isLoaded } = this.state;

    if (!isLoaded){
      return "Loading...";
    }

    if (error) {
      return <Alert variant="info">{error}</Alert>;
    }

    let page = null;
    let settings = null;
    if (docu.accessLevel <= accessLevels.manager) {
      page = <DiffWrapper />;
      if (docu.accessLevel === accessLevels.admin) {
        settings = <Link href={`/documentation/${docuId}/settings`}><Button variant="primary" className="float-right"><i className="fas fa-cog" /></Button></Link>;
      }
    } else if (docu.accessLevel === accessLevels.author) {
      page = <EditWrapper />;
    } else {
      return (<Redirect to="/" />);
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
            <p>{docu.description}</p>
          </Col>
        </Row>
        {page}
      </Container>
    );
  }
}

DocumentationPage.propTypes = {
  docuId: PropTypes.number.isRequired,
};


export default hot(module)(DocumentationPage);
