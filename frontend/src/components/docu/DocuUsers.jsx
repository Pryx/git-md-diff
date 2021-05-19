import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, Card,
} from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import Documentation from '../../shapes/documentation';
import User from '../../shapes/user';
import UserAdd from './UserAdd';
import UsersTable from './UsersTable';

/**
 * DocuUsers is a component used in documentation settings to help
 * manage the users
 */
class DocuUsers extends React.Component {
  state = {
    error: '',
    users: [],
  };

  constructor(props) {
    super(props);

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
      });
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
   * This fetches the user data
   */
  async fetchUsers() {
    const { docu } = this.props;

    this.setState(
      {
        users: [],
      },
    );

    const json = await secureKy().get(`${window.env.api.backend}/documentations/${docu.id}/users`).json();

    this.setState(
      {
        users: json.data,
      },
    );
  }

  render() {
    const { users, error } = this.state;
    const { docu, userData } = this.props;

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          {error.toString()}
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
          <UsersTable users={users} currentUser={userData} callback={this.addUserCallback} />
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
