import lodash from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, Card, Table,
} from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import UserAdd from './UserAdd';
import accessLevels from '../constants/access-levels';
import { store } from '../store/index';
import Documentation from '../entities/documentation';
import { logOut } from '../actions';
import { secureKy } from '../entities/secure-ky';
import User from '../entities/user';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocuUsers extends React.Component {
  state = {
    error: '',
    users: [],
  };

  constructor(props) {
    super(props);

    this.handleRemoveUser = this.handleRemoveUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.fetchUsers = this.fetchUsers.bind(this);
    this.addUserCallback = this.addUserCallback.bind(this);
  }

  componentDidMount() {
    this.fetchUsers().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        error: error.toString(),
      });
    });
  }

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

  addUserCallback() {
    this.fetchUsers();
  }

  removeUser(userId) {
    const { docu } = this.props;
    const remove = async () => {
      const json = await secureKy().delete(`${window.env.api.backend}/documentations/${docu.id}/users/${userId}`);

      if (json.success === false) {
        throw Error("Couldn't remove user!");
      }

      await this.fetchUsers();
    };

    remove().catch((error) => {
      if (error.response && error.response.status === 403) {
        store.dispatch(logOut());
      }

      this.setState({
        error: error.toString(),
      });
    });
  }

  async fetchUsers() {
    const { docu } = this.props;

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

    const accessLevelsFlipped = lodash.invert(accessLevels);
    const tableContent = users.map((u) => (
      <tr key={u.id}>
        <td>{u.id}</td>
        <td>{u.name}</td>
        <td>{u.email || '<unknown>'}</td>
        <td>{accessLevelsFlipped[u.accessLevel]}</td>
        <td>
          { userData.id !== u.id
          && <Button variant="danger" size="sm" onClick={() => this.handleRemoveUser(u)}><i className="fas fa-trash" /></Button>}
        </td>
      </tr>
    ));

    let alert = null;
    if (error) {
      alert = (
        <Alert variant="danger">
          Error:
          {error}
        </Alert>
      );
    }

    return (
      <Card>
        <Card.Header>User management</Card.Header>
        <Card.Body>
          {alert}
          <UserAdd docu={docu} callback={this.addUserCallback} />
          <Table className="mt-3" striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
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
  docu: PropTypes.shape(Documentation.getShape()).isRequired,
  userData: PropTypes.shape(User.getShape()),
};

function mapStateToProps(state) {
  return { userData: state.userData };
}

export default hot(module)(connect(mapStateToProps)(DocuUsers));
