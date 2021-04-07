import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Row } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import { logOut, updateDocumentationList } from '../actions';
import Documentation from '../entities/documentation';
import secureKy from '../entities/secure-ky';
import { store } from '../store/index';

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
      const json = await secureKy().get(`${window.env.api.backend}/documentations`).json();
      store.dispatch(
        updateDocumentationList(json.data),
      );
      this.setState({
        isLoaded: true,
      });
    };

    fetchDocus().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        isLoaded: true,
        error: error.toString(),
      });
    });
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded,
    } = this.state;

    const { docuList } = this.props;

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
        <Link key={docu.id} href={`/documentation/${docu.id}`}>
          <Card className="docu-card">
            <Card.Header>
              {docu.name}
            </Card.Header>
            <Card.Body>
              {docu.description}
            </Card.Body>
            <Card.Footer className="text-right">
              <i className={`fab fa-${docu.provider}`} />
            </Card.Footer>
          </Card>
        </Link>
      ));
    }

    return (
      <Row>
        <Link href="/documentation/new">
          <Card className="docu-card">
            <Card.Header>
              Create new documentation
            </Card.Header>
            <Card.Body>
              <span className="add-circle"><i className="fas fa-plus" /></span>
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
  docuList: PropTypes.arrayOf(PropTypes.shape(Documentation.getShape())).isRequired,
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList,
  }
);

export default hot(module)(connect(mapStateToProps)(DocuOverview));
