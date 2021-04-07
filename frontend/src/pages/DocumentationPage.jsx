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
import accessLevels from '../constants/access-levels';
import Documentation from '../entities/documentation';
import { store } from '../store/index';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationPage extends React.Component {
  state = {
    error: '',
  };

  constructor(props) {
    super(props);

    const { docuId } = this.props;
    store.dispatch(documentationSelected(docuId));
  }

  render() {
    const { docuId, docuList } = this.props;
    const { error } = this.state;

    if (error) {
      return <Alert variant="info">{error}</Alert>;
    }

    if (!docuList) {
      return (<Redirect to="/" />);
    }

    const docu = docuList.find((d) => d.id === docuId);
    let page = null;
    let settings = null;
    if (docu.accessLevel <= accessLevels.manager) {
      page = <DiffWrapper />;
      settings = <Link href={`/documentation/${docuId}/settings`}><Button variant="primary" className="float-right"><i className="fas fa-cog" /></Button></Link>;
    } else if (docu.accessLevel === accessLevels.author) {
      page = <Alert variant="info">Todo: Display files for author access</Alert>;
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
  docuList: PropTypes.arrayOf(PropTypes.shape(Documentation.getShape())).isRequired,
  docuId: PropTypes.number.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList,
  }
);

export default hot(module)(connect(mapStateToProps)(DocumentationPage));
