import {
  Tooltip,
  Alert, Button, Card, OverlayTrigger, Table,
} from 'react-bootstrap';
import lodash from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import Dialog from 'react-bootstrap-dialog';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import accessLevels from '../../constants/access-levels';
import Documentation from '../../shapes/documentation';
import User from '../../shapes/user';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import UserAdd from './UserAdd';

/**
 * DocuUsers is a component used in documentation settings to help
 * manage the users
 */
class DocuUsers extends React.Component {
  state = {
    error: '',
    users: [],
    isLoaded: false,
  };

  constructor(props) {
    super(props);

    this.handleRemoveUser = this.handleRemoveUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.fetchUsers = this.fetchUsers.bind(this);
    this.addUserCallback = this.addUserCallback.bind(this);
    this.handleInfoDialog = this.handleInfoDialog.bind(this);
  }

  /**
   * Loads user data on mount
   */
  componentDidMount() {
    this.fetchUsers().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        error: errorMessage,
        isLoaded: true,
      });
    });
  }

  /**
   * Shows the dialog before user removal
   * @param {Object} user The user object
   */
  handleRemoveUser(user) {
    this.dialog.show({
      title: 'Remove user',
      body: `Do you want to remove user ${user.name} (${user.email})?`,
      bsSize: 'md',
      actions: [
        Dialog.CancelAction(),
        Dialog.Action(
          'Remove user',
          () => this.removeUser(user.id),
          'btn-danger',
        ),
      ],
    });
  }

  /**
   * Shows the information about different access levels.
   * @param {Object} user The user object
   */
  handleInfoDialog() {
    this.dialog.show({
      title: 'User access levels',
      body: (
        <div>
          <ul>
            <li>
              <strong>Admin</strong>
              {' '}
              - has full access to the repository
            </li>
            <li>
              <strong>Manager</strong>
              {' '}
              - can view all proofreading requests, create new proofreading requests, and edit files
            </li>
            <li>
              <strong>Author</strong>
              {' '}
              - can edit files and view their proofreading requests
            </li>
            <li>
              <strong>Proofreader</strong>
              {' '}
              - can edit only files included in their proofreading request
            </li>
          </ul>
        </div>),
      bsSize: 'md',
      actions: [Dialog.SingleOKAction()],
    });
  }

  /**
   * This callback runs when user was added, to refresh the table
   */
  addUserCallback() {
    this.fetchUsers();
  }

  /**
   * This removes the user from the documentation
   * @param {number} userId ID of the user to remove
   */
  removeUser(userId) {
    const { docu } = this.props;
    const remove = async () => {
      const json = await secureKy().delete(`${window.env.api.backend}/documentations/${docu.id}/users/${userId}`);

      if (json.success === false) {
        throw Error("Couldn't remove user!");
      }

      await this.fetchUsers();
    };

    remove().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        error: errorMessage,
        isLoaded: true,
      });
    });
  }

  /**
   * This fetches the user data
   */
  async fetchUsers() {
    const { docu } = this.props;

    this.setState(
      {
        isLoaded: false,
      },
    );

    const json = await secureKy().get(`${window.env.api.backend}/documentations/${docu.id}/users`).json();

    this.setState(
      {
        users: json.data,
        isLoaded: true,
      },
    );
  }

  render() {
    const { users, error, isLoaded } = this.state;
    const { docu, userData } = this.props;

    const accessLevelsFlipped = lodash.invert(accessLevels);
    let tableContent;

    if (isLoaded) {
      const unknownUser = (
        <OverlayTrigger overlay={(
          <Tooltip>
            The user has not yet registered in this app, therefore we do not know their email.
          </Tooltip>
        )}
        >
          <span className="help">
            unknown
            <i className="fas fa-info-circle" />
          </span>
        </OverlayTrigger>
      );
      tableContent = users.map((u) => (
        <tr key={u.id}>
          <td>{u.name}</td>
          <td>
            {u.email || unknownUser}
          </td>
          <td>{accessLevelsFlipped[u.accessLevel]}</td>
          <td>
            { userData.id !== u.id
            && <Button variant="danger" size="sm" onClick={() => this.handleRemoveUser(u)}><i className="fas fa-trash" /></Button>}
          </td>
        </tr>
      ));
    } else {
      tableContent = (
        <tr>
          <td colSpan="999">
            Loading...
          </td>
        </tr>
      );
    }

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          {error}
        </Alert>
      );
    }

    return (
      <Card>
        <Card.Header className="users-header">
          User management
          <Button className="float-right" variant="outline-primary" size="sm" onClick={this.handleInfoDialog}>
            Access level info
          </Button>
        </Card.Header>
        <Card.Body>
          {alert}
          <UserAdd docu={docu} callback={this.addUserCallback} />
          <Table className="mt-3" striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Access level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableContent}
            </tbody>
          </Table>
        </Card.Body>
        <Dialog ref={(component) => { this.dialog = component; }} />
      </Card>
    );
  }
}

DocuUsers.defaultProps = {
  userData: {},
};

DocuUsers.propTypes = {
  docu: PropTypes.shape(Documentation).isRequired,
  userData: PropTypes.shape(User),
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(DocuUsers));
