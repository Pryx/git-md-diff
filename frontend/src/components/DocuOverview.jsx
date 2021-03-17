import { hot } from 'react-hot-loader';
import React from 'react';
import { Link } from 'wouter';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import { Alert, Badge, Row } from 'react-bootstrap';
import Diff from '../diff/diff';

/**
 * Diff view shows the diff file contents. Currently this
 * even handles the file diffing itself, this should
 * probably be offloaded to the server.
 */
class DocuOverview extends React.Component {
  link = null;

  state = {
    isLoaded: false,
    docus: [],
  };

  constructor(props) {
    super(props);
    this.options = { hideCode: props.hideCode, returnMdx: true, debug: false };

    // This is needed because for some reason encodeUriComponent doesn't encode dots
    this.link = `/edit/${this.docuId}/${encodeURIComponent(props.file).replace('.', '%2E')}`;
  }

  componentDidMount() {
    fetch('/api/documentations')
      .then((r) => r.json())
      .then(
        (response) => {
          let docus = response.data;
          this.setState({
            isLoaded: true,
            docus
          });
        },
        (error) => {
          this.setState({
            error,
          });
        },
      );
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const {
      error, isLoaded, docus,
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
    if (docus.length){
      items = docus.map((docu) =>    (
        <Link href={"/documentation/"+docu.id}>
          <Card className="docu-card">
            <Card.Header>
              {docu.name}
            </Card.Header>
            <Card.Body>
              {docu.description}
            </Card.Body>
            <Card.Footer className="text-right">
              <i class={"fab fa-"+docu.provider}></i>
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

};

export default hot(module)(DocuOverview);
