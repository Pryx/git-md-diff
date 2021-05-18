import React from 'react';
import { Alert, Row } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { hot } from 'react-hot-loader';
import { Link } from 'wouter';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';

/**
 * Docu overview displays the users documentations on the dashboard
 */
class DocuOverview extends React.Component {
  state = {
    isLoaded: false,
  };

  /**
   * Fetches the information about all documentations the user has access to
   */
  componentDidMount() {
    const fetchDocus = async () => {
      const json = await secureKy().get(`${window.env.api.backend}/documentations`).json();

      this.setState({
        docuList: json.data,
        isLoaded: true,
      });
    };

    fetchDocus().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        isLoaded: true,
        error: errorMessage,
      });
    });
  }

  /**
   * Error boundary
   * @param {*} error The error that occured in one of the components
   * @returns derived state
   */
  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded, docuList,
    } = this.state;

    if (error) {
      return (
        <Alert variant="danger">
          Error loading your documentations.
          {error}
        </Alert>
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
        <Link to="/documentation/new">
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

export default hot(module)(DocuOverview);
