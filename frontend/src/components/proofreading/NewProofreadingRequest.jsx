import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import Select from 'react-select';
import { Redirect } from 'wouter';
import Change from '../../shapes/change';
import User from '../../shapes/user';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';

/**
 * New proofreading request encompasses the proofreading request creation
 */
class NewProofreadingRequest extends React.Component {
  state = {
    error: null,
    title: '',
    description: '',
    proofreader: null,
    users: [],
  };

  constructor(props) {
    super(props);

    this.createNewRequest = this.createNewRequest.bind(this);
  }

  /**
   * Init the component on mount - fetch users etc.
   */
  componentDidMount() {
    const { from, to } = this.props;

    this.setState({
      title: `Proofreading changes from ${from} to ${to}`,
    });

    this.fetchUsers().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        error: errorMessage,
      });
    });
  }

  /**
   * Fetches the users that can be proofreaders
   */
  async fetchUsers() {
    const { docuId, userData } = this.props;

    const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/users`).json();

    this.setState(
      {
        users: json.data.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })).filter((u) => u.value !== userData.id),
      },
    );
  }

  /**
   * Handles the request creation
   */
  createNewRequest() {
    const {
      docuId, userData, excludedChanges, version, from, to,
    } = this.props;

    const { title, description, proofreader } = this.state;

    if (!title) {
      this.setState({ error: 'Title is required' });
      return;
    }

    if (!proofreader) {
      this.setState({ error: 'Proofreader is required' });
      return;
    }

    this.setState({ error: null });

    const makeRequest = async () => {
      const json = await secureKy().put(`${window.env.api.backend}/proofreading/`, {
        json: {
          docuId,
          title,
          targetBranch: version,
          description,
          revFrom: from,
          revTo: to,
          requester: userData.id,
          proofreader: proofreader.value,
          excluded: excludedChanges,
        },
      }).json();

      this.setState(
        {
          reqId: json.data.id,
        },
      );
    };

    makeRequest();
  }

  render() {
    const {
      error, title, description, proofreader, users, reqId,
    } = this.state;

    const {
      docuId, onCancel, excludedChanges, changes, from, to, version,
    } = this.props;

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger" className="mt-4">
          {error.toString()}
        </Alert>
      );
    }

    if (reqId) {
      return <Redirect to={`/documentation/${docuId}/proofreading/${reqId}`} />;
    }

    const flatChanges = changes.map((c) => c.newFile);
    const filteredChanges = flatChanges.filter((c) => excludedChanges.indexOf(c) === -1);

    const inclChanges = filteredChanges.map((c) => <li key={c}>{c}</li>);
    const exclChanges = excludedChanges.map((c) => <li key={c}>{c}</li>);

    return (
      <div className="diff">
        {alert}
        <Row className="mt-4">
          <Form.Group as={Col}>
            <Form.Label>Request title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => {
                this.setState({ title: e.target.value });
              }}
            />
            <Form.Text className="text-muted">
              Required: The title should be informative and easily distinguishable.
            </Form.Text>
          </Form.Group>
        </Row>
        <Row className="mt-2">
          <Form.Group as={Col}>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => {
                this.setState({ description: e.target.value });
              }}
            />
            <Form.Text className="text-muted">
              Are there any specific areas the proofreader should focus on?
              This will be displayed on the request page.
            </Form.Text>
          </Form.Group>
        </Row>
        <Row className="mt-2">
          <Form.Group as={Col}>
            <Form.Label>Proofreader</Form.Label>
            <Select
              options={users}
              placeholder="Select user"
              value={proofreader}
              onChange={(p) => {
                this.setState({ proofreader: p });
              }}
            />
            <Form.Text className="text-muted">
              Required: The user that will proofread this request
            </Form.Text>
          </Form.Group>
        </Row>
        <Row className="mt-4">
          <Col>
            <div className="mb-2"><strong>Review range:</strong></div>
            <span className="mr-4">
              From:
              <strong>{from}</strong>
            </span>
            <span className="mr-4">
              To:
              <strong>{to}</strong>
            </span>
            <span className="mr-4">
              Will merge to branch:
              <strong>{version}</strong>
            </span>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <strong>Included files:</strong>
            <ul>
              {inclChanges}
            </ul>
          </Col>
          <Col>
            <strong>Excluded files:</strong>
            <ul>
              {exclChanges}
            </ul>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <Button variant="danger" onClick={onCancel}>Cancel</Button>
            <Button className="float-right" variant="success" onClick={this.createNewRequest}>Submit</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

NewProofreadingRequest.defaultProps = {
  onCancel: null,
  changes: [],
  excludedChanges: [],
};

NewProofreadingRequest.propTypes = {
  docuId: PropTypes.number.isRequired,
  onCancel: PropTypes.func,
  version: PropTypes.string.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  changes: PropTypes.arrayOf(PropTypes.shape(Change)),
  excludedChanges: PropTypes.arrayOf(PropTypes.string),
  userData: PropTypes.shape(User).isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  changes: state.changes,
  excludedChanges: state.excludedChanges,
  from: state.startRevision ? (state.startRevision.commit || state.startRevision.branch) : '',
  to: state.endRevision ? (state.endRevision.commit || state.endRevision.branch) : '',
  version: state.endRevision ? state.endRevision.branch : '',
  userData: state.userData,
});

export default hot(module)(connect(mapStateToProps)(NewProofreadingRequest));
