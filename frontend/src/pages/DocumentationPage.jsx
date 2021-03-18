import { hot } from 'react-hot-loader';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { store } from '../store/index';
import { documentationSelected } from '../actions';
import { Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import accessLevels from '../constants/access-levels';
import DiffWrapper from '../components/DiffWrapper';
import { Redirect } from 'wouter';


/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationPage extends React.Component {
  state = {
    success: false,
    error: ""
  }

  componentDidMount(){
    const {docuId} = this.props;
    store.dispatch(documentationSelected(docuId));
  }

  render() {
    const {docuId, docuList} = this.props;

    if (!docuList){

    }

    const docu = docuList.find(d => d.id == docuId);

    let page = null;
    if (docu.accessLevel <= accessLevels.manager){
      page = <DiffWrapper />;
    } else if (docu.accessLevel == accessLevels.author) {
      page = <Alert variant="info">Todo: Display files for author access</Alert>
    } else {
      page = <Redirect to="/" />;
    }

    return (
      <Container className="mt-5">
        <Row>
          <Col lg={12} xs={12}>
            <h1>{docu.name}</h1>
            <p>{docu.description}</p>
          </Col>
        </Row>
        {page}
      </Container>
    );
  }
}

DocumentationPage.propTypes = {
  docuList: PropTypes.array
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList
  }
);

export default hot(module)(connect(mapStateToProps)(DocumentationPage));