import React from 'react';
import { Alert, Row } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { hot } from 'react-hot-loader';
import { Link } from 'wouter';
import { logoutUser, secureKy } from '../entities/secure-ky';

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

      this.setState({
        docuList: json.data,
        isLoaded: true,
      });
    };

    fetchDocus().catch((error) => {
      if (error.response && error.response.status === 403) {
        logoutUser();
        return;
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
      error, isLoaded, docuList,
    } = this.state;

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

export default hot(module)(DocuOverview);
