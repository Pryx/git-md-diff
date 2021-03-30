import { hot } from 'react-hot-loader';
import React from 'react';
import { Link, useLocation } from 'wouter';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import { Alert, Badge, Row } from 'react-bootstrap';
import { store } from '../store/index';
import { connect } from 'react-redux';
import { logOut, updateDocumentationList } from '../actions';
import ky from 'ky';



/**
 * Diff view shows the diff file contents. Currently this
 * even handles the file diffing itself, this should
 * probably be offloaded to the server.
 */
class DocuOverview extends React.Component {
  state = {
    isLoaded: false,
  };

  componentDidMount() {
    const fetchDocus = async () => {
      const json = await ky(`/api/documentations`).json();
      store.dispatch(
        updateDocumentationList(json.data)
      );
      this.setState({
        isLoaded: true,
      });
    };

    fetchDocus().catch((error) => {
      if (error.response.status == 403){
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error,
      })
    });
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded,
    } = this.state;

    const { docuList } = this.props

    if (error) {
      return (
        <Alert variant="danger">Error loading your documentations. Please try again later</Alert>
      );
    }

    if (!isLoaded) {
      return (
        <Card className="docu-card">
          <Card.Header>
            Loading...
          </Card.Header>
          <Card.Body>
            Loading...
          </Card.Body>
          <Card.Footer className="text-right">
            <small>Loading...</small>
          </Card.Footer>
        </Card>
      );
    }

    let items = null;
    if (docuList.length) {
      items = docuList.map((docu) => (
        <Link key={docu.id} href={"/documentation/" + docu.id}>
          <Card className="docu-card">
            <Card.Header>
              {docu.name}
            </Card.Header>
            <Card.Body>
              {docu.description}
            </Card.Body>
            <Card.Footer className="text-right">
              <i className={"fab fa-" + docu.provider}></i>
            </Card.Footer>
          </Card>
        </Link>
      )
      );
    }

    return (
      <Row>
        <Link href="/documentation/new">
          <Card className="docu-card">
            <Card.Header>
              Create new documentation
            </Card.Header>
            <Card.Body>
              <span className="add-circle"><i className="fas fa-plus"></i></span>
            </Card.Body>
          </Card>
        </Link>
        {items}
      </Row>
    );
  }
}

DocuOverview.defaultProps = {
};

DocuOverview.propTypes = {
  docuList: PropTypes.array
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList
  }
);

export default hot(module)(connect(mapStateToProps)(DocuOverview));
